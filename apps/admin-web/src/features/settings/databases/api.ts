import { api, getTokens } from '@/lib/api';
import type {
  BackupFileInfo,
  DatabasesInventory,
} from './types';

export function listSectionDatabases() {
  return api<DatabasesInventory>('/settings/databases');
}

export function listDatabaseBackups(sectionKey?: string) {
  const q = sectionKey
    ? `?sectionKey=${encodeURIComponent(sectionKey)}`
    : '';
  return api<BackupFileInfo[]>(`/settings/databases/backups${q}`);
}

export function createDatabaseBackup(sectionKey: string) {
  return api<BackupFileInfo>('/settings/databases/backup', {
    method: 'POST',
    body: JSON.stringify({ sectionKey }),
  });
}

export function restoreDatabaseBackup(sectionKey: string, filename: string) {
  return api<{ success: boolean }>('/settings/databases/restore', {
    method: 'POST',
    body: JSON.stringify({ sectionKey, filename }),
  });
}

export function deleteDatabaseBackup(sectionKey: string, filename: string) {
  return api<{ success: boolean }>(
    `/settings/databases/backups/${encodeURIComponent(sectionKey)}/${encodeURIComponent(filename)}`,
    { method: 'DELETE' },
  );
}

/** تنزيل ملف النسخة مع التوكن */
export async function downloadDatabaseBackup(
  sectionKey: string,
  filename: string,
) {
  const tokens = getTokens();
  const res = await fetch(
    `/api/settings/databases/backups/${encodeURIComponent(sectionKey)}/${encodeURIComponent(filename)}/download`,
    {
      headers: tokens
        ? { Authorization: `Bearer ${tokens.accessToken}` }
        : undefined,
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'تعذر تنزيل النسخة');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function uploadDatabaseRestore(
  sectionKey: string,
  file: File,
) {
  const tokens = getTokens();
  const body = new FormData();
  body.append('sectionKey', sectionKey);
  body.append('file', file);
  const res = await fetch('/api/settings/databases/restore/upload', {
    method: 'POST',
    headers: tokens
      ? { Authorization: `Bearer ${tokens.accessToken}` }
      : undefined,
    body,
  });
  if (!res.ok) {
    let message = 'تعذر الاستعادة من الملف';
    try {
      const data = (await res.json()) as { message?: string | string[] };
      if (typeof data.message === 'string') message = data.message;
      else if (Array.isArray(data.message)) message = data.message.join(', ');
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<{ success: boolean; filename: string }>;
}
