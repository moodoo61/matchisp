/** خيارات فترة الرسوم والملخصات */
export const VIEWING_REPORTS_PERIODS = [
  { hours: 24, label: 'يوم' },
  { hours: 24 * 7, label: '7 أيام' },
  { hours: 24 * 30, label: '30 يوماً' },
  { hours: 24 * 90, label: '90 يوماً' },
] as const;

export const DEFAULT_VIEWING_REPORTS_PERIOD_HOURS = 24;
