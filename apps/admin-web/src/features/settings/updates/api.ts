import { api } from '@/lib/api';
import type { ApplyUpdateResult, UpdateJobStatus, UpdateStatus } from './types';

export function getUpdateStatus() {
  return api<UpdateStatus>('/settings/updates');
}

export function getUpdateJob() {
  return api<UpdateJobStatus>('/settings/updates/job');
}

export function checkForUpdates() {
  return api<UpdateStatus>('/settings/updates/check', { method: 'POST' });
}

export function applyUpdates() {
  return api<ApplyUpdateResult>('/settings/updates/apply', { method: 'POST' });
}
