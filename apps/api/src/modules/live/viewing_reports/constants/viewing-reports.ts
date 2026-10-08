/** مفتاح إعدادات تقارير المشاهدة */
export const VIEWING_REPORTS_META_KEY = 'live.viewing_reports';

/** مسار استقبال USER_END داخل API هذا السيرفر */
export const USER_END_WEBHOOK_PATH =
  '/api/public/live/viewing-reports/user-end';

/** اسم سكربت مشغّل USER_END المحلي */
export const USER_END_SCRIPT_NAME = 'mist-user-end-report.sh';

export type ViewingReportsSettings = {
  /** تفعيل استقبال USER_END ومزامنة المشغّل مع Mist لقنوات اللوحة فقط */
  enabled: boolean;
  /** مسار السكربت المُسجَّل في Mist (مشغّل محلي) */
  handlerPath: string;
};

export type ViewingReportsStoredSettings = {
  enabled: boolean;
};

export const DEFAULT_VIEWING_REPORTS_STORED: ViewingReportsStoredSettings = {
  enabled: false,
};

/**
 * معرّفات مشغّلنا داخل USER_END — لا نلمس أي مشغّل لا يحتويها
 * (يشمل السكربت المحلي والرابط HTTP القديم لإزالته عند التحديث).
 */
export const VIEWING_REPORTS_TRIGGER_MARKERS = [
  USER_END_SCRIPT_NAME,
  '/api/public/live/viewing-reports/user-end',
] as const;
