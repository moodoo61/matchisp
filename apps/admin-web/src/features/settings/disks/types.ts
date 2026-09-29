export type DiskUsage = {
  filesystem: string;
  fstype: string;
  sizeBytes: number;
  usedBytes: number;
  availBytes: number;
  capacityPercent: number;
  mountpoint: string;
};

export type BlockDeviceNode = {
  name: string;
  path: string;
  type: string;
  sizeBytes: number;
  fstype: string | null;
  mountpoint: string | null;
  label: string | null;
  uuid: string | null;
  model: string | null;
  serial: string | null;
  rota: boolean | null;
  removable: boolean | null;
  transport: string | null;
  state: string | null;
  children: BlockDeviceNode[];
  usage: DiskUsage | null;
  noteLabel: string;
  noteText: string;
  canUnmount: boolean;
};

export type DisksInventory = {
  checkedAt: string;
  devices: BlockDeviceNode[];
  mounts: DiskUsage[];
};

export type DiskSmartResult = {
  devicePath: string;
  available: boolean;
  passed: boolean | null;
  model: string | null;
  serial: string | null;
  temperatureC: number | null;
  powerOnHours: number | null;
  detail: string;
};

export type MountDiskInput = {
  devicePath: string;
  mountpoint: string;
  options?: string;
  createDir?: boolean;
};

export type UnmountDiskInput = {
  devicePath?: string;
  mountpoint?: string;
  lazy?: boolean;
};

export type DiskNoteInput = {
  devicePath: string;
  label?: string;
  notes?: string;
};

const TYPE_LABELS: Record<string, string> = {
  disk: 'قرص',
  part: 'قسم',
  lvm: 'LVM',
  crypt: 'مشفّر',
  rom: 'قرص ضوئي',
  loop: 'Loop',
};

export function diskTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  const digits = i === 0 ? 0 : v >= 100 ? 0 : v >= 10 ? 1 : 2;
  return `${v.toFixed(digits)} ${units[i]}`;
}
