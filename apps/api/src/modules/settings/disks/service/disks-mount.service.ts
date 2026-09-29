import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { execFile } from 'child_process';
import { mkdir } from 'fs/promises';
import { promisify } from 'util';
import { AuditService } from '../../../audit/audit.service';
import {
  DEVICE_PATH_RE,
  MOUNTPOINT_RE,
  PROTECTED_MOUNTPOINTS,
} from '../constants/disk-safety';
import { MountDiskDto } from '../dto/mount-disk.dto';
import { UnmountDiskDto } from '../dto/unmount-disk.dto';

const execFileAsync = promisify(execFile);

@Injectable()
export class DisksMountService {
  private readonly logger = new Logger(DisksMountService.name);

  constructor(private readonly audit: AuditService) {}

  async mount(dto: MountDiskDto, actorId: string) {
    const devicePath = dto.devicePath.trim();
    const mountpoint = dto.mountpoint.trim();
    this.assertDevice(devicePath);
    this.assertMountpoint(mountpoint);

    if (PROTECTED_MOUNTPOINTS.has(mountpoint) && mountpoint === '/') {
      throw new BadRequestException('لا يمكن تغيير تركيب الجذر عبر الواجهة');
    }

    if (dto.createDir !== false) {
      await mkdir(mountpoint, { recursive: true });
    }

    const args = [devicePath, mountpoint];
    if (dto.options?.trim()) {
      args.unshift('-o', dto.options.trim());
    }

    try {
      await execFileAsync('mount', args, {
        timeout: 30000,
        maxBuffer: 1024 * 1024,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`فشل mount ${devicePath} → ${mountpoint}: ${msg}`);
      throw new BadRequestException(`فشل التركيب: ${this.extractExecError(err)}`);
    }

    await this.audit.log({
      actorId,
      action: 'mount',
      resource: 'settings.disk',
      resourceId: devicePath,
      metadata: { mountpoint, options: dto.options ?? null },
    });

    return { success: true, devicePath, mountpoint };
  }

  async unmount(dto: UnmountDiskDto, actorId: string) {
    const target = (dto.mountpoint ?? dto.devicePath ?? '').trim();
    if (!target) {
      throw new BadRequestException('حدد الجهاز أو نقطة التركيب');
    }

    if (dto.mountpoint) {
      this.assertMountpoint(dto.mountpoint.trim());
      if (PROTECTED_MOUNTPOINTS.has(dto.mountpoint.trim())) {
        throw new BadRequestException(
          `نقطة التركيب المحمية لا يمكن فصلها: ${dto.mountpoint}`,
        );
      }
    }
    if (dto.devicePath) this.assertDevice(dto.devicePath.trim());

    const args: string[] = [];
    if (dto.lazy) args.push('-l');
    args.push(target);

    try {
      await execFileAsync('umount', args, {
        timeout: 30000,
        maxBuffer: 1024 * 1024,
      });
    } catch (err) {
      this.logger.warn(`فشل umount ${target}: ${this.extractExecError(err)}`);
      throw new BadRequestException(`فشل الفصل: ${this.extractExecError(err)}`);
    }

    await this.audit.log({
      actorId,
      action: 'unmount',
      resource: 'settings.disk',
      resourceId: target,
      metadata: { lazy: !!dto.lazy },
    });

    return { success: true, target };
  }

  private assertDevice(path: string) {
    if (!DEVICE_PATH_RE.test(path)) {
      throw new BadRequestException('مسار الجهاز غير صالح');
    }
  }

  private assertMountpoint(path: string) {
    if (!MOUNTPOINT_RE.test(path) || path.includes('..')) {
      throw new BadRequestException('مسار التركيب غير صالح');
    }
  }

  private extractExecError(err: unknown): string {
    if (!err || typeof err !== 'object') return String(err);
    const e = err as { stderr?: Buffer | string; message?: string };
    const stderr =
      typeof e.stderr === 'string'
        ? e.stderr
        : Buffer.isBuffer(e.stderr)
          ? e.stderr.toString('utf8')
          : '';
    return (stderr || e.message || String(err)).trim().slice(0, 400);
  }
}
