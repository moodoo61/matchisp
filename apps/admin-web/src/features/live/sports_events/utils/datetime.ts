/** أدوات موعد المباراة — تاريخ + وقت أصليان */

const pad = (n: number) => String(n).padStart(2, '0');

export type KickoffParts = {
  /** YYYY-MM-DD */
  day: string;
  /** HH:MM */
  time: string;
};

export function todayDayKey(base = new Date()): string {
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
}

export function partsFromIso(iso: string | null | undefined): KickoffParts {
  const d = iso ? new Date(iso) : new Date();
  const safe = Number.isNaN(d.getTime()) ? new Date() : d;
  return {
    day: todayDayKey(safe),
    time: `${pad(safe.getHours())}:${pad(safe.getMinutes())}`,
  };
}

/** افتراضي للإضافة: اليوم + الوقت الحالي مقرباً لـ 5 دقائق */
export function defaultKickoffParts(): KickoffParts {
  const now = new Date();
  const m = now.getMinutes();
  const add = m % 5 === 0 ? 0 : 5 - (m % 5);
  now.setMinutes(m + add, 0, 0);
  return partsFromIso(now.toISOString());
}

export function partsToIso(parts: KickoffParts): string {
  const [y, m, d] = parts.day.split('-').map(Number);
  const [hh, mm] = parts.time.split(':').map(Number);
  const dt = new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
  return dt.toISOString();
}

export function formatKickoff(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ar', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  });
}
