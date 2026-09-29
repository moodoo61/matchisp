export const SPORTS_EVENTS_SETTINGS_META_KEY = 'sports_events.settings';

/** وضع مسح أحداث اليوم تلقائياً */
export type SportsEventsAutoClearMode = 'all' | 'after_hours';

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
};

export const DEFAULT_SPORTS_EVENTS_SETTINGS: SportsEventsSettings = {
  enabled: true,
  title: 'الأحداث الرياضية',
  timezone: 'Asia/Baghdad',
  autoClearEnabled: false,
  autoClearMode: 'after_hours',
  autoClearAfterHours: 6,
  lastFullClearAt: null,
};

export const AUTO_CLEAR_HOURS_MIN = 1;
export const AUTO_CLEAR_HOURS_MAX = 168;
