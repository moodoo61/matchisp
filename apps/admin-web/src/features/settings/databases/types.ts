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

export type DatabasesInventory = {
  checkedAt: string;
  databases: SectionDatabaseStatus[];
};

export type BackupFileInfo = {
  sectionKey: string;
  filename: string;
  sizeBytes: number;
  createdAt: string;
};

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  const digits = i === 0 ? 0 : v >= 100 ? 0 : v >= 10 ? 1 : 2;
  return `${v.toFixed(digits)} ${units[i]}`;
}
