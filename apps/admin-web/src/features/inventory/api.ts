import { api } from '@/lib/api';
import type {
  DeviceUnit,
  InventoryItem,
  InventorySummary,
  StockDocument,
  StockMovement,
  UserBrief,
} from './types';

export type MetaOption = { value: string; label: string };

export function getInventorySummary() {
  return api<InventorySummary>('/inventory/summary');
}

export function listItemKinds() {
  return api<MetaOption[]>('/inventory/meta/kinds');
}

export function listDeviceStatuses() {
  return api<MetaOption[]>('/inventory/meta/device-statuses');
}

export function listDocumentTypes() {
  return api<MetaOption[]>('/inventory/meta/document-types');
}

export function listInventoryMembers() {
  return api<UserBrief[]>('/inventory/meta/members');
}

export function listItems() {
  return api<InventoryItem[]>('/inventory/items');
}

export function createItem(input: {
  code: string;
  name: string;
  kind: string;
  unit?: string;
  minQty?: number;
  notes?: string;
}) {
  return api<InventoryItem>('/inventory/items', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateItem(
  id: string,
  input: Partial<{
    code: string;
    name: string;
    unit: string;
    minQty: number;
    notes: string;
    active: boolean;
  }>,
) {
  return api<InventoryItem>(`/inventory/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function listDevices(params?: {
  itemId?: string;
  status?: string;
  holderUserId?: string;
  workOrderId?: string;
  q?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.itemId) qs.set('itemId', params.itemId);
  if (params?.status) qs.set('status', params.status);
  if (params?.holderUserId) qs.set('holderUserId', params.holderUserId);
  if (params?.workOrderId) qs.set('workOrderId', params.workOrderId);
  if (params?.q?.trim()) qs.set('q', params.q.trim());
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return api<DeviceUnit[]>(`/inventory/devices${suffix}`);
}

export function markDeviceInstalled(
  id: string,
  input: { installedAssetId: string; notes?: string },
) {
  return api<DeviceUnit>(`/inventory/devices/${id}/install`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function markDeviceFaulty(id: string) {
  return api<DeviceUnit>(`/inventory/devices/${id}/faulty`, {
    method: 'POST',
  });
}

export function listDocuments(type?: string) {
  const suffix = type ? `?type=${encodeURIComponent(type)}` : '';
  return api<StockDocument[]>(`/inventory/documents${suffix}`);
}

export function getDocument(id: string) {
  return api<StockDocument>(`/inventory/documents/${id}`);
}

export function createDocument(input: {
  type: string;
  note?: string;
  issuedToUserId?: string;
  workOrderId?: string;
  partsRequestId?: string;
  lines: Array<{
    itemId: string;
    quantity?: number;
    adjustDelta?: number;
    deviceUnitId?: string;
    serial?: string;
    note?: string;
  }>;
}) {
  return api<StockDocument>('/inventory/documents', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function postDocument(id: string) {
  return api<StockDocument>(`/inventory/documents/${id}/post`, {
    method: 'POST',
  });
}

export function cancelDocument(id: string) {
  return api<StockDocument>(`/inventory/documents/${id}/cancel`, {
    method: 'POST',
  });
}

export function listMovements(params?: {
  itemId?: string;
  deviceUnitId?: string;
  type?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.itemId) qs.set('itemId', params.itemId);
  if (params?.deviceUnitId) qs.set('deviceUnitId', params.deviceUnitId);
  if (params?.type) qs.set('type', params.type);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return api<StockMovement[]>(`/inventory/movements${suffix}`);
}
