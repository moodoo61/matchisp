export const DOCUMENT_STATUSES = ['draft', 'posted', 'cancelled'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'مسودة',
  posted: 'معتمد',
  cancelled: 'ملغى',
};
