import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { DatabasesBackupService } from './databases-backup.service';
import { DatabasesCatalogService } from './databases-catalog.service';

const execFileAsync = promisify(execFile);

export type SectionDatabaseStatus = {
  key: string;
  dbName: string;
  label: string;
  description: string;
  configured: boolean;
  sizeBytes: number | null;
  backupCount: number;
  lastBackupAt: string | null;
};

@Injectable()
export class DatabasesInventoryService {
  private readonly logger = new Logger(DatabasesInventoryService.name);

  constructor(
    private readonly catalog: DatabasesCatalogService,
    private readonly backups: DatabasesBackupService,
  ) {}

  async list(): Promise<{ checkedAt: string; databases: SectionDatabaseStatus[] }> {
    const allBackups = await this.backups.listBackups();
    const databases: SectionDatabaseStatus[] = [];

    for (const def of this.catalog.listDefs()) {
      const sectionBackups = allBackups.filter((b) => b.sectionKey === def.key);
      let configured = false;
      let sizeBytes: number | null = null;
      try {
        const conn = this.catalog.parseUrl(def);
        configured = true;
        sizeBytes = await this.databaseSize(conn);
      } catch (err) {
        this.logger.debug(
          `${def.key}: ${err instanceof Error ? err.message : err}`,
        );
      }
      databases.push({
        key: def.key,
        dbName: def.dbName,
        label: def.label,
        description: def.description,
        configured,
        sizeBytes,
        backupCount: sectionBackups.length,
        lastBackupAt: sectionBackups[0]?.createdAt ?? null,
      });
    }

    return {
      checkedAt: new Date().toISOString(),
      databases,
    };
  }

  private async databaseSize(
    conn: {
      host: string;
      port: string;
      user: string;
      password: string;
      database: string;
    },
  ): Promise<number | null> {
    try {
      const { stdout } = await execFileAsync(
        'psql',
        [
          '-h',
          conn.host,
          '-p',
          conn.port,
          '-U',
          conn.user,
          '-d',
          conn.database,
          '-tA',
          '-c',
          `SELECT pg_database_size(current_database())`,
        ],
        {
          env: this.catalog.envFor(conn),
          timeout: 10000,
          maxBuffer: 1024 * 1024,
        },
      );
      const n = Number(stdout.trim());
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  }
}
