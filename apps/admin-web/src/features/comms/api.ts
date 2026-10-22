import { api } from '@/lib/api';
import type {
  ActiveCall,
  AsteriskStatus,
  CdrItem,
  CommsAndroidAppPublicInfo,
  CommsDiscoverySettings,
  CreateExtensionInput,
  ExtensionItem,
  UpdateCommsDiscoverySettingsInput,
  UpdateExtensionInput,
} from './types';

export function getAsteriskStatus() {
  return api<AsteriskStatus>('/comms/asterisk/status');
}

export function listExtensions() {
  return api<ExtensionItem[]>('/comms/extensions');
}

export function createExtension(input: CreateExtensionInput) {
  return api<ExtensionItem>('/comms/extensions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateExtension(id: string, input: UpdateExtensionInput) {
  return api<ExtensionItem>(`/comms/extensions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteExtension(id: string) {
  return api<{ ok: boolean }>(`/comms/extensions/${id}`, {
    method: 'DELETE',
  });
}

export function listActiveCalls() {
  return api<ActiveCall[]>('/comms/calls/active');
}

export function listCdr(params?: {
  q?: string;
  from?: string;
  to?: string;
  limit?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.q) sp.set('q', params.q);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  if (params?.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return api<CdrItem[]>(`/comms/calls/cdr${qs ? `?${qs}` : ''}`);
}

export function getDiscoverySettings() {
  return api<CommsDiscoverySettings>('/comms/discovery-settings');
}

export function updateDiscoverySettings(
  input: UpdateCommsDiscoverySettingsInput,
) {
  return api<CommsDiscoverySettings>('/comms/discovery-settings', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

/** معلومات عامة لزر تحميل تطبيق الأندرويد (بدون توكن) */
export async function getPublicAndroidAppInfo(): Promise<CommsAndroidAppPublicInfo> {
  const res = await fetch('/api/public/comms/android-app', { cache: 'no-store' });
  if (!res.ok) {
    return {
      showDownloadButton: false,
      available: false,
      downloadPath: '/api/public/comms/android-app/download',
    };
  }
  return (await res.json()) as CommsAndroidAppPublicInfo;
}
