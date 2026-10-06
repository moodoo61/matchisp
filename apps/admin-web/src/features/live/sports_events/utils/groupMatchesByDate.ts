import type { SportMatch } from '../types';

export type MatchDateGroup = {
  key: string;
  label: string;
  matches: SportMatch[];
};

function matchDateKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'unknown';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatMatchDateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('ar', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
}

/** تجميع المباريات حسب تاريخ الموعد */
export function groupSportMatchesByDate(items: SportMatch[]): MatchDateGroup[] {
  const sorted = [...items].sort(
    (a, b) =>
      new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
  );
  const map = new Map<string, MatchDateGroup>();
  for (const match of sorted) {
    const key = matchDateKey(match.kickoffAt);
    const existing = map.get(key);
    if (existing) {
      existing.matches.push(match);
      continue;
    }
    map.set(key, {
      key,
      label: formatMatchDateLabel(match.kickoffAt),
      matches: [match],
    });
  }
  return [...map.values()];
}
