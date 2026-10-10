/**
 * إعدادات mpegts.js للبث المباشر.
 * نفضّل استقرار التخزين على تقليل التأخير العدواني —
 * liveSync + liveBufferLatencyChasing يفرّغان المخزن ويسبّبان تقطيعاً
 * بينما VLC يحتفظ بمخزن أكبر على نفس الرابط.
 *
 * @see https://github.com/xqq/mpegts.js/blob/master/docs/api.md
 */
export const MPEGTS_LIVE_MEDIA = {
  type: 'mpegts' as const,
  isLive: true,
  hasAudio: true,
  hasVideo: true,
};

export const MPEGTS_LIVE_CONFIG = {
  enableWorker: true,
  /** مخزن IO — يمنع التقطيع عند تقلب الشبكة (الافتراضي true) */
  enableStashBuffer: true,
  /** ~768KB بداية أوفر من 384KB الافتراضي لقنوات IPTV */
  stashInitialSize: 768 * 1024,
  lazyLoad: false,
  /** إيقاف ملاحقة التأخير العدوانية التي تفرّغ الـ MSE buffer */
  liveBufferLatencyChasing: false,
  liveSync: false,
  /** تنظيف خلفي للمصدر دون تقليص المخزن الأمامي */
  autoCleanupSourceBuffer: true,
  autoCleanupMaxBackwardDuration: 30,
  autoCleanupMinBackwardDuration: 20,
  fixAudioTimestampGap: true,
};
