export const DOCUMENT_TYPES = [
  'receipt',
  'issue',
  'return',
  'adjustment',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  receipt: 'توريد',
  issue: 'صرف',
  return: 'إرجاع',
  adjustment: 'تعديل',
};
