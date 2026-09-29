import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { execFile } from 'child_process';
import { rename, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';
import { AuditService } from '../../../audit/audit.service';
import { DatabasesBackupService } from './databases-backup.service';
import { DatabasesCatalogService } from './databases-catalog.service';

const execFileAsync = promisify(execFile);

@Injectable()
export class DatabasesRestoreService {
  private readonly logger = new Logger(DatabasesRestoreService.name);

  constructor(
    private readonly catalog: DatabasesCatalogService,
    private readonly backups: DatabasesBackupService,
    private readonly audit: AuditService,
  ) {}

  async restoreFromStored(
    sectionKey: string,
    filename: string,
    actorId: string,
  ) {
    const def = this.catalog.requireDef(sectionKey);
    this.backups.assertFilename(filename);
    if (!filename.startsWith(`${sectionKey}_`)) {
      throw new BadRequestException('الملف لا يخص هذا القسم');
    }
    const filePath = join(this.backups.sectionDir(sectionKey), filename);
    try {
      await stat(filePath);
    } catch {
      throw new NotFoundException('ملف النسخة غير موجود');
    }
    return this.runRestore(def.key, def.dbName, filePath, filename, actorId);
  }

  async restoreFromUpload(
    sectionKey: string,
    tempPath: string,
    originalName: string,
    actorId: string,
  ) {
    const def = this.catalog.requireDef(sectionKey);
    if (!originalName.toLowerCase().endsWith('.dump')) {
      try {
        await unlink(tempPath);
      } catch {
        /* ignore */
      }
      throw new BadRequestException(
        'يُقبل فقط ملف .dump (صيغة pg_dump المخصّصة)',
      );
    }

    const dir = await this.backups.ensureSectionDir(def.key);
    const stamp = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    const filename = `${def.key}_${stamp.getFullYear()}${p(stamp.getMonth() + 1)}${p(stamp.getDate())}-${p(stamp.getHours())}${p(stamp.getMinutes())}${p(stamp.getSeconds())}.dump`;
    const dest = join(dir, filename);
    await rename(tempPath, dest);

    return this.runRestore(def.key, def.dbName, dest, filename, actorId);
  }

  private async runRestore(
    sectionKey: string,
    dbName: string,
    filePath: string,
    filename: string,
    actorId: string,
  ) {
    const def = this.catalog.requireDef(sectionKey);
    const conn = this.catalog.parseUrl(def);

    try {
      await execFileAsync(
        'pg_restore',
        [
          '--clean',
          '--if-exists',
          '--no-owner',
          '--no-acl',
          '-d',
          conn.database,
          '-h',
          conn.host,
          '-p',
          conn.port,
          '-U',
          conn.user,
          filePath,
        ],
        {
          env: this.catalog.envFor(conn),
          timeout: 15 * 60 * 1000,
          maxBuffer: 4 * 1024 * 1024,
        },
      );
    } catch (err) {
      const msg = this.execMsg(err);
      const code = (err as { code?: number }).code ?? 1;
      if (/FATAL|could not/i.test(msg)) {
        this.logger.warn(`فشل استعادة ${dbName}: ${msg}`);
        throw new BadRequestException(`فشل الاستعادة: ${msg}`);
      }
      this.logger.warn(
        `استعادة ${dbName} انتهت (code=${code}): ${msg.slice(0, 240)}`,
      );
    }

    await this.audit.log({
      actorId,
      action: 'restore',
      resource: 'settings.database',
      resourceId: sectionKey,
      metadata: { dbName, filename },
    });

    return { success: true, sectionKey, filename };
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
    return (stderr || e.message || String(err)).trim().slice(0, 800);
  }
}
