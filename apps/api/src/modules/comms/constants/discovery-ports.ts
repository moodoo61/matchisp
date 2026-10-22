/** منافذ إعلان اكتشاف خادم الاتصال — التطبيق يبحث في هذه القائمة فقط */
export const COMMS_DISCOVERY_PORTS = [
  18760, 18761, 18762, 18763, 18764, 18765, 18766, 18767, 18768, 18769,
] as const;

export type CommsDiscoveryPort = (typeof COMMS_DISCOVERY_PORTS)[number];

export const COMMS_DISCOVERY_SERVICE = 'match-comms';
export const COMMS_DISCOVERY_META_KEY = 'comms.discovery';
export const COMMS_DISCOVERY_PROBE = 'MATCH_DISCOVER';
export const COMMS_DISCOVERY_BEACON_PREFIX = 'MATCH_BEACON ';

export const DEFAULT_ASTERISK_WS_PORT = 8088;

export type CommsDiscoveryStoredSettings = {
  enabled: boolean;
  port: CommsDiscoveryPort;
  displayName: string;
  /** إظهار زر تحميل تطبيق الأندرويد — الافتراضي true */
  showDownloadButton: boolean;
};

export type CommsDiscoverySettingsDto = CommsDiscoveryStoredSettings & {
  allowedPorts: readonly number[];
  listening: boolean;
  listenError: string | null;
  /** هل ملف الـ APK موجود على الخادم */
  apkAvailable: boolean;
  /** مسار تحميل عام نسبي */
  apkDownloadPath: string;
};

export const DEFAULT_COMMS_DISCOVERY_SETTINGS: CommsDiscoveryStoredSettings = {
  enabled: false,
  port: 18760,
  displayName: 'Match',
  showDownloadButton: true,
};

/** مسار ثابت داخل المستودع: downloads/match-call-test.apk */
export const COMMS_ANDROID_APK_RELATIVE = 'downloads/match-call-test.apk';
export const COMMS_ANDROID_APK_PUBLIC_PATH =
  '/api/public/comms/android-app/download';

export function isCommsDiscoveryPort(value: number): value is CommsDiscoveryPort {
  return (COMMS_DISCOVERY_PORTS as readonly number[]).includes(value);
}
