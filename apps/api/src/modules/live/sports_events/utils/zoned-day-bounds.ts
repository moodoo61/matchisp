/**
 * حدود اليوم التقويمي داخل منطقة زمنية معيّنة (بداية شاملة / نهاية حصرية).
 */
export function zonedDayBounds(
  now: Date,
  timeZone: string,
): { start: Date; end: Date } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);

  const start = zonedLocalToUtc(year, month, day, 0, 0, 0, timeZone);
  const end = zonedLocalToUtc(year, month, day + 1, 0, 0, 0, timeZone);
  return { start, end };
}

function zonedLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  // ابدأ بتخمين UTC ثم صحّح فرق المنطقة
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const asTz = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(utcGuess)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;

  const asTzMs = Date.UTC(
    Number(asTz.year),
    Number(asTz.month) - 1,
    Number(asTz.day),
    Number(asTz.hour),
    Number(asTz.minute),
    Number(asTz.second),
  );
  const wantedMs = Date.UTC(year, month - 1, day, hour, minute, second);
  return new Date(utcGuess.getTime() + (wantedMs - asTzMs));
}
