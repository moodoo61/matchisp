import { api } from '@/lib/api';
import type { ApplyUpdateResult, UpdateStatus } from './types';

export function getUpdateStatus() {
  return api<UpdateStatus>('/settings/updates');
}

export function checkForUpdates() {
  return api<UpdateStatus>('/settings/updates/check', { method: 'POST' });
}

export function applyUpdates() {
  return api<ApplyUpdateResult>('/settings/updates/apply', { method: 'POST' });
}
