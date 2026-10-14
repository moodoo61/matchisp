export const DEVICE_STATUSES = [
  'in_stock',
  'issued',
  'installed',
  'faulty',
  'scrapped',
] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  in_stock: 'في المخزن',
  issued: 'مصروف',
  installed: 'مركّب',
  faulty: 'تالف',
  scrapped: 'مستبعد',
};
