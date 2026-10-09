import { api } from '@/lib/api';
import type {
  InterfacesInventory,
  NetworkDnsInfo,
  RoutesInventory,
  SstpStatus,
} from './types';

export function listInterfaces() {
  return api<InterfacesInventory>('/settings/network/interfaces');
}

export function setInterfaceState(ifName: string, state: 'up' | 'down') {
  return api<{ success: boolean }>('/settings/network/interfaces/state', {
    method: 'POST',
    body: JSON.stringify({ ifName, state }),
  });
}

export function addInterfaceAddress(ifName: string, cidr: string) {
  return api<{ success: boolean }>('/settings/network/interfaces/addresses', {
    method: 'POST',
    body: JSON.stringify({ ifName, cidr }),
  });
}

export function removeInterfaceAddress(ifName: string, cidr: string) {
  return api<{ success: boolean }>(
    '/settings/network/interfaces/addresses/delete',
    {
      method: 'POST',
      body: JSON.stringify({ ifName, cidr }),
    },
  );
}

/** تحويل المنفذ إلى ملف اتصال match-* الدائم تحت NetworkManager */
export function adoptInterfaceNm(ifName: string) {
  return api<{
    success: boolean;
    ifName: string;
    connection: string;
    addresses: string[];
    persistent: boolean;
  }>('/settings/network/interfaces/adopt', {
    method: 'POST',
    body: JSON.stringify({ ifName }),
  });
}

export function listRoutes() {
  return api<RoutesInventory>('/settings/network/routes');
}

export function setDefaultRoute(gateway: string, device?: string) {
  return api<{ success: boolean }>('/settings/network/routes/default', {
    method: 'POST',
    body: JSON.stringify({ gateway, device: device || undefined }),
  });
}

export function getDns() {
  return api<NetworkDnsInfo>('/settings/network/dns');
}

export function setDns(body: {
  servers: string[];
  search?: string[];
  device?: string;
}) {
  return api<{
    success: boolean;
    device: string;
    servers: string[];
    search: string[];
  }>('/settings/network/dns', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getSstpStatus() {
  return api<SstpStatus>('/settings/network/sstp');
}

export function updateSstpSettings(body: {
  host?: string;
  username?: string;
  password?: string;
  certWarn?: boolean;
  tlsExt?: boolean;
  autoConnect?: boolean;
}) {
  return api<SstpStatus>('/settings/network/sstp', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function connectSstp() {
  return api<SstpStatus>('/settings/network/sstp/connect', { method: 'POST' });
}

export function disconnectSstp() {
  return api<SstpStatus>('/settings/network/sstp/disconnect', {
    method: 'POST',
  });
}
