export function formatBytes(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return raw;
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}ث`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return `${m}د ${s}ث`;
  const h = Math.floor(m / 60);
  return `${h}س ${m % 60}د`;
}

export function hoursFromSec(sec: number): number {
  return Math.round((sec / 3600) * 10) / 10;
}

/** عرض يوم YYYY-MM-DD بالعربية */
export function formatDayLabel(day: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return date.toLocaleDateString('ar', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Baghdad',
  });
}
