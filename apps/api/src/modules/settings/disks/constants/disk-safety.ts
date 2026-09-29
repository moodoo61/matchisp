/** نقاط تركيب محمية لا يُسمح بفصلها عبر الواجهة */
export const PROTECTED_MOUNTPOINTS = new Set([
  '/',
  '/boot',
  '/boot/efi',
  '/home',
  '/usr',
  '/var',
  '/etc',
  '/opt',
  '/root',
]);

/** امتدادات أجهزة مسموح بها للتركيب/الفصل */
export const DEVICE_PATH_RE = /^\/dev\/[A-Za-z0-9/_.+-]+$/;

export const MOUNTPOINT_RE = /^\/[A-Za-z0-9/_.+-]*$/;
