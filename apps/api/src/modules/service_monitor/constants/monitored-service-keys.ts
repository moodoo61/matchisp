/** مفاتيح الخدمات المراقبة — ثابتة ومتزامنة مع الـ seed */
export const MONITORED_SERVICE_KEYS = [
  'mistserver',
  'librenms',
  'asterisk',
] as const;

export type MonitoredServiceKey = (typeof MONITORED_SERVICE_KEYS)[number];

export function isMonitoredServiceKey(
  value: string,
): value is MonitoredServiceKey {
  return (MONITORED_SERVICE_KEYS as readonly string[]).includes(value);
}
