export const SPORTS_EVENTS_SETTINGS_META_KEY = 'sports_events.settings';

/** وضع مسح أحداث اليوم تلقائياً */
export type SportsEventsAutoClearMode = 'all' | 'after_hours';

export const DEFAULT_EXTERNAL_MATCHES_URL =
  'https://to.zerolag.live/api/matches/today/';

export type SportsEventsSettings = {
  /** تفعيل قسم الأحداث الرياضية */
  enabled: boolean;
  /** عنوان العرض */
  title: string;
  /** المنطقة الزمنية لحساب «أحداث اليوم» */
  timezone: string;
  /** تفعيل جدول المسح التلقائي */
  autoClearEnabled: boolean;
  /** حذف الكل كل N ساعة | بعد مرور N ساعة على الموعد */
  autoClearMode: SportsEventsAutoClearMode;
  /** عدد الساعات */
  autoClearAfterHours: number;
  /** آخر مسح كامل (وضع all) — ISO أو null */
  lastFullClearAt: string | null;
  /** تفعيل ميزة المزامنة من مصدر خارجي (رابط + أوضاع) */
  externalSyncEnabled: boolean;
  /** رابط مصدر المباريات */
  externalSyncUrl: string;
  /** مزامنة عامة دورية */
  externalSyncGeneralEnabled: boolean;
  externalSyncGeneralIntervalMinutes: number;
  externalSyncGeneralIntervalSeconds: number;
  lastExternalSyncGeneralAt: string | null;
  /** مزامنة أثناء وجود مباراة بدأت ولم تنتهِ */
  externalSyncLiveEnabled: boolean;
  externalSyncLiveIntervalMinutes: number;
  externalSyncLiveIntervalSeconds: number;
  lastExternalSyncLiveAt: string | null;
  /** آخر مزامنة بأي وضع — للعرض */
  lastExternalSyncAt: string | null;
};

export const DEFAULT_SPORTS_EVENTS_SETTINGS: SportsEventsSettings = {
  enabled: true,
  title: 'الأحداث الرياضية',
  timezone: 'Asia/Baghdad',
  autoClearEnabled: false,
  autoClearMode: 'after_hours',
  autoClearAfterHours: 6,
  lastFullClearAt: null,
  externalSyncEnabled: false,
  externalSyncUrl: DEFAULT_EXTERNAL_MATCHES_URL,
  externalSyncGeneralEnabled: true,
  externalSyncGeneralIntervalMinutes: 5,
  externalSyncGeneralIntervalSeconds: 0,
  lastExternalSyncGeneralAt: null,
  externalSyncLiveEnabled: false,
  externalSyncLiveIntervalMinutes: 0,
  externalSyncLiveIntervalSeconds: 30,
  lastExternalSyncLiveAt: null,
  lastExternalSyncAt: null,
};

export const AUTO_CLEAR_HOURS_MIN = 1;
export const AUTO_CLEAR_HOURS_MAX = 168;

export const SYNC_MINUTES_MIN = 0;
export const SYNC_MINUTES_MAX = 180;
export const SYNC_SECONDS_MIN = 0;
export const SYNC_SECONDS_MAX = 59;
/** أقل فترة مزامنة إجمالية */
export const SYNC_INTERVAL_MIN_TOTAL_SECONDS = 5;

export function syncIntervalToMs(minutes: number, seconds: number): number {
  return (Math.max(0, minutes) * 60 + Math.max(0, seconds)) * 1000;
}

export function syncIntervalTotalSeconds(
  minutes: number,
  seconds: number,
): number {
  return Math.max(0, minutes) * 60 + Math.max(0, seconds);
}
