import { Injectable } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { PrismaSettingsService } from '../../../../database/database.module';
import { PROTECTED_MOUNTPOINTS } from '../constants/disk-safety';
import type {
  BlockDeviceNode,
  DiskUsage,
  DisksInventory,
} from '../types/disk.types';

const execFileAsync = promisify(execFile);

type LsblkRaw = {
  name?: string;
  path?: string | null;
  type?: string;
  size?: string;
  fstype?: string | null;
  mountpoint?: string | null;
  label?: string | null;
  uuid?: string | null;
  model?: string | null;
  serial?: string | null;
  rota?: boolean | null;
  rm?: boolean | null;
  tran?: string | null;
  state?: string | null;
  children?: LsblkRaw[];
};

@Injectable()
export class DisksInventoryService {
  constructor(private readonly prisma: PrismaSettingsService) {}

  async inventory(): Promise<DisksInventory> {
    const [devicesRaw, mounts, notes] = await Promise.all([
      this.readLsblk(),
      this.readDf(),
      this.prisma.diskNote.findMany(),
    ]);

    const notesByPath = new Map(
      notes.map((n) => [n.devicePath, { label: n.label, notes: n.notes }]),
    );
    const usageByMount = new Map(mounts.map((m) => [m.mountpoint, m]));
    const usageByFs = new Map(mounts.map((m) => [m.filesystem, m]));

    const devices = devicesRaw.map((d) =>
      this.mapNode(d, notesByPath, usageByMount, usageByFs),
    );

    return {
      checkedAt: new Date().toISOString(),
      devices,
      mounts,
    };
  }

  private async readLsblk(): Promise<LsblkRaw[]> {
    const { stdout } = await execFileAsync(
      'lsblk',
      [
        '-J',
        '-b',
        '-o',
        'NAME,PATH,TYPE,SIZE,FSTYPE,MOUNTPOINT,LABEL,UUID,MODEL,SERIAL,ROTA,RM,TRAN,STATE',
      ],
      { timeout: 15000, maxBuffer: 4 * 1024 * 1024 },
    );
    const parsed = JSON.parse(stdout) as { blockdevices?: LsblkRaw[] };
    return parsed.blockdevices ?? [];
  }

  private async readDf(): Promise<DiskUsage[]> {
    const { stdout } = await execFileAsync('df', ['-B1', '-T', '-P'], {
      timeout: 10000,
      maxBuffer: 2 * 1024 * 1024,
    });
    const lines = stdout.trim().split('\n').slice(1);
    const rows: DiskUsage[] = [];
    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length < 7) continue;
      const [
        filesystem,
        fstype,
        sizeStr,
        usedStr,
        availStr,
        capacityStr,
        ...mountParts
      ] = parts;
      const mountpoint = mountParts.join(' ');
      if (!filesystem.startsWith('/dev/')) continue;
      const sizeBytes = Number(sizeStr) || 0;
      const usedBytes = Number(usedStr) || 0;
      const availBytes = Number(availStr) || 0;
      const capacityPercent = Number(String(capacityStr).replace('%', '')) || 0;
      rows.push({
        filesystem,
        fstype,
        sizeBytes,
        usedBytes,
        availBytes,
        capacityPercent,
        mountpoint,
      });
    }
    return rows;
  }

  private mapNode(
    raw: LsblkRaw,
    notesByPath: Map<string, { label: string; notes: string }>,
    usageByMount: Map<string, DiskUsage>,
    usageByFs: Map<string, DiskUsage>,
  ): BlockDeviceNode {
    const path =
      (typeof raw.path === 'string' && raw.path) ||
      (raw.name ? `/dev/${raw.name}` : '');
    const mountpoint = raw.mountpoint ?? null;
    const note = notesByPath.get(path);
    const usage =
      (mountpoint ? usageByMount.get(mountpoint) : undefined) ??
      usageByFs.get(path) ??
      null;

    const children = (raw.children ?? []).map((c) =>
      this.mapNode(c, notesByPath, usageByMount, usageByFs),
    );

    const sizeBytes =
      typeof raw.size === 'number'
        ? raw.size
        : /^\d+$/.test(String(raw.size ?? ''))
          ? Number(raw.size)
          : 0;

    return {
      name: raw.name ?? path,
      path,
      type: raw.type ?? 'unknown',
      sizeBytes,
      fstype: raw.fstype ?? null,
      mountpoint,
      label: raw.label ?? null,
      uuid: raw.uuid ?? null,
      model: raw.model ?? null,
      serial: raw.serial ?? null,
      rota: raw.rota ?? null,
      removable: raw.rm ?? null,
      transport: raw.tran ?? null,
      state: raw.state ?? null,
      children,
      usage,
      noteLabel: note?.label ?? '',
      noteText: note?.notes ?? '',
      canUnmount: this.canUnmount(mountpoint, raw.type),
    };
  }

  private canUnmount(mountpoint: string | null, type?: string): boolean {
    if (!mountpoint || mountpoint === '[SWAP]') return false;
    if (PROTECTED_MOUNTPOINTS.has(mountpoint)) return false;
    if (type === 'disk' && mountpoint === '/') return false;
    return true;
  }
}
