export const WORK_ORDER_TYPES = [
  'install',
  'corrective',
  'preventive',
  'outage',
] as const;

export type WorkOrderType = (typeof WORK_ORDER_TYPES)[number];

export const WORK_ORDER_TYPE_LABELS: Record<WorkOrderType, string> = {
  install: 'تركيب / إنشاء',
  corrective: 'صيانة تصحيحية',
  preventive: 'صيانة وقائية',
  outage: 'انقطاع / طوارئ',
};
