import { api } from '@/lib/api';
import type {
  ActiveCall,
  AsteriskStatus,
  CdrItem,
  CreateExtensionInput,
  ExtensionItem,
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
