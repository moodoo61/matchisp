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
  /** الحجم بالبايت — يُنسَّق في الواجهة فقط */
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
  raw: string | null;
};
