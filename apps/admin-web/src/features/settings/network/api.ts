import { api } from '@/lib/api';
import type {
  InterfacesInventory,
  NetworkDnsInfo,
  RoutesInventory,
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
  return api<{ success: boolean }>('/settings/network/interfaces/addresses/delete', {
    method: 'POST',
    body: JSON.stringify({ ifName, cidr }),
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
