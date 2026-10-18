import { api, apiUpload } from '@/lib/api';
import type {
  Asset,
  AssetDetail,
  MaintenanceMetrics,
  MaintenanceNotification,
  ServiceRequest,
  ServiceRequestAttachment,
  UserBrief,
  WorkOrder,
  WorkOrderAttachment,
  WorkOrderComment,
} from './types';

export type MetaOption = { value: string; label: string };

export function listRequestTypes() {
  return api<MetaOption[]>('/maintenance/requests/meta/types');
}

export function listRequestPriorities() {
  return api<MetaOption[]>('/maintenance/requests/meta/priorities');
}

export function listAssetKinds() {
  return api<MetaOption[]>('/maintenance/assets/meta/kinds');
}

export function listAssets() {
  return api<Asset[]>('/maintenance/assets');
}

export function getAsset(id: string) {
  return api<AssetDetail>(`/maintenance/assets/${id}`);
}

export function createAsset(input: {
  kind: string;
  label: string;
  externalRef?: string;
  notes?: string;
}) {
  return api<Asset>('/maintenance/assets', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function uploadWorkOrderAttachment(workOrderId: string, file: File) {
  return apiUpload<WorkOrderAttachment>(
    `/maintenance/work-orders/${workOrderId}/attachments`,
    file,
  );
}

export function uploadServiceRequestAttachment(
  requestId: string,
  file: File,
) {
  return apiUpload<ServiceRequestAttachment>(
    `/maintenance/requests/${requestId}/attachments`,
    file,
  );
}

export function getMaintenanceMetrics() {
  return api<MaintenanceMetrics>('/maintenance/metrics');
}

export function listMaintenanceNotifications() {
  return api<MaintenanceNotification[]>('/maintenance/notifications');
}

export function getMaintenanceNotificationsUnreadCount() {
  return api<{ count: number }>('/maintenance/notifications/unread-count');
}

export function markMaintenanceNotificationRead(id: string) {
  return api(`/maintenance/notifications/${id}/read`, { method: 'POST' });
}

export function markAllMaintenanceNotificationsRead() {
  return api('/maintenance/notifications/read-all', { method: 'POST' });
}

export type PartsRequest = {
  id: string;
  workOrderId: string;
  description: string;
  quantity: number;
  status: string;
  rejectReason: string | null;
  createdAt: string;
  requestedBy?: { id: string; name: string; username: string } | null;
  workOrder?: {
    id: string;
    number: number;
    title: string;
    status: string;
    type: string;
  };
};

export function listOpenPartsRequests() {
  return api<PartsRequest[]>('/maintenance/parts-requests');
}

export function createPartsRequest(
  workOrderId: string,
  input: { description: string; quantity?: number; setWaiting?: boolean },
) {
  return api<PartsRequest>(
    `/maintenance/work-orders/${workOrderId}/parts-requests`,
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export function updatePartsRequest(
  id: string,
  input: {
    status: 'acknowledged' | 'fulfilled' | 'rejected';
    rejectReason?: string;
    resumeWorkOrder?: boolean;
  },
) {
  return api<PartsRequest>(`/maintenance/parts-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function listServiceRequests() {
  return api<ServiceRequest[]>('/maintenance/requests');
}

export function getServiceRequest(id: string) {
  return api<ServiceRequest>(`/maintenance/requests/${id}`);
}

export function createServiceRequest(input: {
  title: string;
  description?: string;
  workType: string;
  priority?: string;
  assetId?: string;
  locationText?: string;
  submit?: boolean;
  convertToWorkOrder?: boolean;
  assigneeUserId?: string;
}) {
  return api<ServiceRequest>('/maintenance/requests', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function triageServiceRequest(
  id: string,
  input: {
    workType?: string;
    priority?: string;
    assetId?: string;
    locationText?: string;
    triageNotes?: string;
  },
) {
  return api<ServiceRequest>(`/maintenance/requests/${id}/triage`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function rejectServiceRequest(id: string, reason: string) {
  return api<ServiceRequest>(`/maintenance/requests/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function convertServiceRequest(
  id: string,
  input?: {
    title?: string;
    description?: string;
    approve?: boolean;
    assigneeUserId?: string;
    workType?: string;
    priority?: string;
    assetId?: string;
    locationText?: string;
    triageNotes?: string;
  },
) {
  return api<ServiceRequest>(`/maintenance/requests/${id}/convert`, {
    method: 'POST',
    body: JSON.stringify(input ?? {}),
  });
}

export function deleteServiceRequest(id: string) {
  return api<{ success: boolean; deletedWorkOrders: number }>(
    `/maintenance/requests/${id}`,
    { method: 'DELETE' },
  );
}

export function listWorkOrderHistory(params?: {
  assetId?: string;
  assetKind?: string;
  type?: string;
  q?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.assetId) qs.set('assetId', params.assetId);
  if (params?.assetKind) qs.set('assetKind', params.assetKind);
  if (params?.type) qs.set('type', params.type);
  if (params?.q?.trim()) qs.set('q', params.q.trim());
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return api<WorkOrder[]>(`/maintenance/work-orders/history${suffix}`);
}

export function listWorkOrders() {
  return api<WorkOrder[]>('/maintenance/work-orders');
}

export function listMyWorkOrders() {
  return api<WorkOrder[]>('/maintenance/work-orders/mine');
}

export function listPendingReview() {
  return api<WorkOrder[]>('/maintenance/work-orders/pending-review');
}

export function countPendingReview() {
  return api<{ count: number }>(
    '/maintenance/work-orders/pending-review/count',
  );
}

export function getWorkOrder(id: string) {
  return api<WorkOrder>(`/maintenance/work-orders/${id}`);
}

export function listWorkOrderComments(workOrderId: string) {
  return api<WorkOrderComment[]>(
    `/maintenance/work-orders/${workOrderId}/comments`,
  );
}

export function createWorkOrderComment(workOrderId: string, body: string) {
  return api<WorkOrderComment>(
    `/maintenance/work-orders/${workOrderId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({ body }),
    },
  );
}

export function listWorkOrderMembers() {
  return api<UserBrief[]>('/maintenance/work-orders/meta/members');
}

export function assignWorkOrder(id: string, assigneeUserId: string) {
  return api<WorkOrder>(`/maintenance/work-orders/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ assigneeUserId }),
  });
}

export function acceptWorkOrder(id: string) {
  return api<WorkOrder>(`/maintenance/work-orders/${id}/accept`, {
    method: 'POST',
  });
}

export function rejectAssignment(id: string, reason: string) {
  return api<WorkOrder>(`/maintenance/work-orders/${id}/reject-assignment`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function startWorkOrder(id: string) {
  return api<WorkOrder>(`/maintenance/work-orders/${id}/start`, {
    method: 'POST',
  });
}

export function waitPartsWorkOrder(id: string) {
  return api<WorkOrder>(`/maintenance/work-orders/${id}/wait-parts`, {
    method: 'POST',
  });
}

export function resumeWorkOrder(id: string) {
  return api<WorkOrder>(`/maintenance/work-orders/${id}/resume`, {
    method: 'POST',
  });
}

export function finishFieldWorkOrder(
  id: string,
  input: { completionNotes: string; rootCause?: string },
) {
  return api<WorkOrder>(`/maintenance/work-orders/${id}/finish-field`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function closeWorkOrder(id: string, reviewNotes?: string) {
  return api<WorkOrder>(`/maintenance/work-orders/${id}/close`, {
    method: 'POST',
    body: JSON.stringify({ reviewNotes }),
  });
}

export function reworkWorkOrder(id: string, reason: string) {
  return api<WorkOrder>(`/maintenance/work-orders/${id}/rework`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
