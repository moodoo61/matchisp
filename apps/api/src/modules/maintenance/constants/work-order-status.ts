/** حالات أمر العمل — انظر docs/WORK_ORDERS_DESIGN.md */
export const WORK_ORDER_STATUSES = [
  'draft',
  'approved',
  'assigned',
  'accepted',
  'in_progress',
  'waiting_parts',
  'waiting_access',
  'done_field',
  'rework',
  'closed',
  'cancelled',
] as const;

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
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

/** من → إلى[] المسموح (بدون فحص الدور) */
export const WORK_ORDER_TRANSITIONS: Record<
  WorkOrderStatus,
  readonly WorkOrderStatus[]
> = {
  draft: ['approved', 'cancelled'],
  approved: ['assigned', 'cancelled'],
  assigned: ['approved', 'accepted', 'cancelled'],
  accepted: ['approved', 'assigned', 'in_progress', 'cancelled'],
  in_progress: [
    'waiting_parts',
    'waiting_access',
    'done_field',
    'cancelled',
  ],
  waiting_parts: ['in_progress', 'cancelled'],
  waiting_access: ['in_progress', 'cancelled'],
  done_field: ['rework', 'closed'],
  rework: [
    'in_progress',
    'waiting_parts',
    'waiting_access',
    'done_field',
    'cancelled',
  ],
  closed: [],
  cancelled: [],
};
