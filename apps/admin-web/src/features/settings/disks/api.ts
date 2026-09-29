import { api } from '@/lib/api';
import type {
  DiskNoteInput,
  DiskSmartResult,
  DisksInventory,
  MountDiskInput,
  UnmountDiskInput,
} from './types';

export function getDisksInventory() {
  return api<DisksInventory>('/settings/disks');
}

export function getDiskSmart(devicePath: string) {
  return api<DiskSmartResult>(
    `/settings/disks/smart?devicePath=${encodeURIComponent(devicePath)}`,
  );
}

export function mountDisk(input: MountDiskInput) {
  return api<{ success: boolean }>('/settings/disks/mount', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function unmountDisk(input: UnmountDiskInput) {
  return api<{ success: boolean }>('/settings/disks/unmount', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function upsertDiskNote(input: DiskNoteInput) {
  return api('/settings/disks/notes', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
