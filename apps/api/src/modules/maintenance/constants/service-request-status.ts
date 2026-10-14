export const SERVICE_REQUEST_STATUSES = [
  'draft',
  'submitted',
  'triaged',
  'rejected',
  'converted',
  'closed',
] as const;

export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];

export const SERVICE_REQUEST_STATUS_LABELS: Record<
  ServiceRequestStatus,
  string
> = {
  draft: 'مسودة',
  submitted: 'مقدَّم',
  triaged: 'مفروز',
  rejected: 'مرفوض',
  converted: 'محوَّل لأمر عمل',
  closed: 'مغلق',
};
