/** المنطقة الافتراضية لمواعيد المباريات (تطابق إعدادات الأحداث الرياضية) */
export const DEFAULT_SCHEDULE_TIMEZONE = 'Asia/Baghdad';

/** أجزاء التاريخ/الوقت داخل منطقة زمنية معيّنة */
export function zonedDateTimeParts(iso: string, timeZone: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(d)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  };
}

/** YYYY-MM-DD في المنطقة الزمنية المعطاة */
export function zonedDayKey(isoOrNow: string | number | Date, timeZone: string) {
  const d =
    typeof isoOrNow === 'string' || typeof isoOrNow === 'number'
      ? new Date(isoOrNow)
      : isoOrNow;
  if (Number.isNaN(d.getTime())) return 'unknown';
  return (
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d) || 'unknown'
  );
}
