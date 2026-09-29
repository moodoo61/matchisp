import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { createReadStream } from 'fs';
import {
  mkdir,
  readdir,
  stat,
  unlink,
} from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';
import { AuditService } from '../../../audit/audit.service';
import {
  BACKUP_FILENAME_RE,
} from '../constants/section-databases';
import { DatabasesCatalogService } from './databases-catalog.service';

const execFileAsync = promisify(execFile);

export type BackupFileInfo = {
  sectionKey: string;
  filename: string;
  sizeBytes: number;
  createdAt: string;
};

@Injectable()
export class DatabasesBackupService {
  private readonly logger = new Logger(DatabasesBackupService.name);

  constructor(
    private readonly catalog: DatabasesCatalogService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  rootDir(): string {
    const configured = this.config.get<string>('DATABASE_BACKUP_DIR')?.trim();
    if (configured) return configured;
    return '/opt/match/var/backups/databases';
  }

  sectionDir(sectionKey: string): string {
    return join(this.rootDir(), sectionKey);
  }

  async ensureSectionDir(sectionKey: string): Promise<string> {
    const dir = this.sectionDir(sectionKey);
    await mkdir(dir, { recursive: true });
    return dir;
  }

  private stamp(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  }

  assertFilename(filename: string) {
    if (!BACKUP_FILENAME_RE.test(filename) || filename.includes('..')) {
      throw new BadRequestException('اسم ملف النسخة غير صالح');
    }
  }

  async listBackups(sectionKey?: string): Promise<BackupFileInfo[]> {
    const keys = sectionKey
      ? [this.catalog.requireDef(sectionKey).key]
      : this.catalog.listDefs().map((d) => d.key);

    const out: BackupFileInfo[] = [];
    for (const key of keys) {
      const dir = this.sectionDir(key);
      let names: string[] = [];
      try {
        names = await readdir(dir);
      } catch {
        continue;
      }
      for (const name of names) {
        if (!BACKUP_FILENAME_RE.test(name)) continue;
        if (!name.startsWith(`${key}_`)) continue;
        try {
          const st = await stat(join(dir, name));
          if (!st.isFile()) continue;
          out.push({
            sectionKey: key,
            filename: name,
            sizeBytes: st.size,
            createdAt: st.mtime.toISOString(),
          });
        } catch {
          /* skip */
        }
      }
    }
    out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return out;
  }

  async createBackup(sectionKey: string, actorId: string) {
    const def = this.catalog.requireDef(sectionKey);
    const conn = this.catalog.parseUrl(def);
    const dir = await this.ensureSectionDir(def.key);
    const filename = `${def.key}_${this.stamp()}.dump`;
    const filePath = join(dir, filename);

    try {
      await execFileAsync(
        'pg_dump',
        [
          '-Fc',
          '-f',
          filePath,
          '-d',
          conn.database,
          '-h',
          conn.host,
          '-p',
          conn.port,
          '-U',
          conn.user,
        ],
        {
          env: this.catalog.envFor(conn),
          timeout: 10 * 60 * 1000,
          maxBuffer: 4 * 1024 * 1024,
        },
      );
    } catch (err) {
      this.logger.warn(
        `فشل نسخ ${def.dbName}: ${err instanceof Error ? err.message : err}`,
      );
      try {
        await unlink(filePath);
      } catch {
        /* ignore */
      }
      throw new BadRequestException(
        `فشل إنشاء النسخة: ${this.execMsg(err)}`,
      );
    }

    const st = await stat(filePath);
    await this.audit.log({
      actorId,
      action: 'backup',
      resource: 'settings.database',
      resourceId: def.key,
      metadata: {
        dbName: def.dbName,
        filename,
        sizeBytes: st.size,
      },
    });

    return {
      sectionKey: def.key,
      filename,
      sizeBytes: st.size,
      createdAt: st.mtime.toISOString(),
    };
  }

  async openDownload(sectionKey: string, filename: string) {
    this.catalog.requireDef(sectionKey);
    this.assertFilename(filename);
    if (!filename.startsWith(`${sectionKey}_`)) {
      throw new BadRequestException('الملف لا يخص هذا القسم');
    }
    const filePath = join(this.sectionDir(sectionKey), filename);
    try {
      await stat(filePath);
    } catch {
      throw new NotFoundException('ملف النسخة غير موجود');
    }
    return {
      stream: createReadStream(filePath),
      filename,
    };
  }

  async deleteBackup(
    sectionKey: string,
    filename: string,
    actorId: string,
  ) {
    this.catalog.requireDef(sectionKey);
    this.assertFilename(filename);
    if (!filename.startsWith(`${sectionKey}_`)) {
      throw new BadRequestException('الملف لا يخص هذا القسم');
    }
    const filePath = join(this.sectionDir(sectionKey), filename);
    try {
      await unlink(filePath);
    } catch {
      throw new NotFoundException('ملف النسخة غير موجود');
    }
    await this.audit.log({
      actorId,
      action: 'delete_backup',
      resource: 'settings.database',
      resourceId: sectionKey,
      metadata: { filename },
    });
    return { success: true };
  }

  private execMsg(err: unknown): string {
    if (!err || typeof err !== 'object') return String(err);
    const e = err as { stderr?: Buffer | string; message?: string };
    const stderr =
      typeof e.stderr === 'string'
        ? e.stderr
        : Buffer.isBuffer(e.stderr)
          ? e.stderr.toString('utf8')
          : '';
    return (stderr || e.message || String(err)).trim().slice(0, 500);
  }
}
