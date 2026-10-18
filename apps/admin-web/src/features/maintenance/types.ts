export type UserBrief = {
  id: string;
  name: string;
  username: string;
};

export type Asset = {
  id: string;
  kind: string;
  label: string;
  externalRef: string | null;
  notes: string;
  workOrdersCount?: number;
  requestsCount?: number;
};

export type AssetDetail = Asset & {
  workOrders: Array<{
    id: string;
    number: number;
    title: string;
    type: string;
    status: string;
    priority: string;
    assignee: UserBrief | null;
    fieldFinishedAt: string | null;
    closedAt: string | null;
    createdAt: string;
  }>;
  requests: Array<{
    id: string;
    number: number;
    title: string;
    status: string;
    workType: string;
    priority: string;
    createdAt: string;
  }>;
};

export type WorkOrderAttachment = {
  id: string;
  url: string;
  originalName: string;
  createdAt: string;
  uploadedBy?: UserBrief | null;
};

export type ServiceRequestAttachment = {
  id: string;
  url: string;
  originalName: string;
  createdAt: string;
  uploadedBy?: UserBrief | null;
};

export type WorkOrderComment = {
  id: string;
  workOrderId: string;
  body: string;
  createdAt: string;
  author: UserBrief | null;
  /** الفني | المنشئ | مشارك */
  party: string;
};

export type MaintenanceMetrics = {
  openRequests: number;
  activeWorkOrders: number;
  pendingReview: number;
  waitingParts: number;
  overdue: number;
  avgRepairHours: number | null;
  sampleSize: number;
};

export type MaintenanceNotification = {
  id: string;
  workOrderId: string | null;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type ServiceRequest = {
  id: string;
  number: number;
  title: string;
  description: string;
  status: string;
  workType: string;
  priority: string;
  assetId: string | null;
  locationText: string;
  triageNotes: string;
  rejectReason: string | null;
  reporter: UserBrief | null;
  asset: Asset | null;
  attachments?: ServiceRequestAttachment[];
  workOrders: Array<{
    id: string;
    number: number;
    status: string;
    type: string;
    title: string;
  }>;
  submittedAt: string | null;
  closedAt: string | null;
  createdAt: string;
};

export type StatusEvent = {
  id: string;
  fromStatus: string;
  toStatus: string;
  reason: string | null;
  createdAt: string;
  actor: UserBrief | null;
};

export type PartsRequestRow = {
  id: string;
  description: string;
  quantity: number;
  status: string;
  rejectReason: string | null;
  createdAt: string;
  requestedById?: string;
};

export type WorkOrder = {
  id: string;
  number: number;
  type: string;
  priority: string;
  status: string;
  title: string;
  description: string;
  locationText: string;
  assigneeUserId: string | null;
  completionNotes: string;
  rootCause: string;
  reviewNotes: string;
  reviewedByUserId?: string | null;
  reviewedAt: string | null;
  cancelReason: string | null;
  reworkReason: string | null;
  assignmentRejectReason: string | null;
  respondBy: string | null;
  resolveBy: string | null;
  startedAt: string | null;
  fieldFinishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  createdBy: UserBrief | null;
  assignee: UserBrief | null;
  reviewedBy: UserBrief | null;
  asset: Asset | null;
  request: {
    id: string;
    number: number;
    title: string;
    status: string;
    workType: string;
  } | null;
  statusEvents: StatusEvent[];
  partsRequests?: PartsRequestRow[];
  attachments?: WorkOrderAttachment[];
};

export const ASSET_KIND_LABELS: Record<string, string> = {
  subscriber: 'مشترك',
  device: 'جهاز',
  site: 'موقع',
  address: 'عنوان',
  other: 'أخرى',
};

export const PARTS_STATUS_LABELS: Record<string, string> = {
  open: 'مفتوح',
  acknowledged: 'مُستلم',
  fulfilled: 'مُصرَّف',
  rejected: 'مرفوض',
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة',
  submitted: 'مقدَّم',
  triaged: 'جاهز للتحويل',
  rejected: 'مرفوض',
  converted: 'محوَّل',
  closed: 'مغلق',
};

export const WO_STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة',
  approved: 'معتمد',
  assigned: 'مُعيَّن',
  accepted: 'مقبول',
  in_progress: 'قيد التنفيذ',
  waiting_parts: 'بانتظار مواد',
  waiting_access: 'بانتظار وصول',
  done_field: 'منجَز فنياً',
  rework: 'إعادة تنفيذ',
  closed: 'مغلق',
  cancelled: 'ملغى',
};

export const WO_TYPE_LABELS: Record<string, string> = {
  install: 'تركيب',
  corrective: 'تصحيحية',
  preventive: 'وقائية',
  outage: 'انقطاع',
};

export const PRIORITY_LABELS: Record<string, string> = {
  p1: 'حرج P1',
  p2: 'عالٍ P2',
  p3: 'عادي P3',
  p4: 'منخفض P4',
};

export function formatDt(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('ar-IQ');
}
