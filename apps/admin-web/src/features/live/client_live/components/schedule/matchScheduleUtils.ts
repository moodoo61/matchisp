import type { PublicSportMatch, PublicSportMatchGoal } from '../../types';

export function formatMatchTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
}

export function matchDateKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'unknown';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatMatchDateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('ar', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
}

/** بدأت المباراة: حان الموعد أو الحالة ليست «لم تبدأ» */
export function matchHasStarted(match: PublicSportMatch, nowMs = Date.now()) {
  const kickoff = new Date(match.kickoffAt).getTime();
  if (!Number.isNaN(kickoff) && kickoff <= nowMs) return true;
  const status = match.status?.trim();
  if (status && status !== 'لم تبدأ') return true;
  return false;
}

export function matchCenterLabel(match: PublicSportMatch, nowMs = Date.now()) {
  if (matchHasStarted(match, nowMs)) {
    return `${match.homeGoals ?? 0} – ${match.awayGoals ?? 0}`;
  }
  return 'VS';
}

export type MatchStatusTone =
  | 'live'
  | 'break'
  | 'upcoming'
  | 'finished'
  | 'cancelled';

/** تصنيف نص الحالة الحر إلى فئة لونية للتمييز البصري */
export function matchStatusTone(match: PublicSportMatch): MatchStatusTone {
  const raw = (match.status ?? '').trim().toLowerCase();
  if (!raw) return matchHasStarted(match) ? 'live' : 'upcoming';
  if (/انته|نهائ|full\s?-?time|finished|ended/.test(raw)) return 'finished';
  if (/ملغ|cancel|أ?جل|postpon/.test(raw)) return 'cancelled';
  if (
    /استراح|بين الشوط|half[\s-]?time|ht\b|الشوط/.test(raw) ||
    /توقف مؤقت|paused/.test(raw)
  )
    return 'break';
  if (
    /جار|مباشر|live|الشوط الأول|الشوط الثاني|الشوط الاضافي|تمديد/.test(raw)
  )
    return 'live';
  if (/لم تبدأ|قادم|لم تنطلق|scheduled|upcoming|not started/.test(raw))
    return 'upcoming';
  return matchHasStarted(match) ? 'live' : 'upcoming';
}

export function goalsForSide(
  goals: PublicSportMatchGoal[] | undefined,
  isHome: boolean,
) {
  return (goals ?? []).filter((goal) => goal.isHome === isHome);
}

export function formatGoalLine(goal: PublicSportMatchGoal) {
  const minute = goal.minuteLabel?.trim() || '';
  const player = goal.player?.trim() || '';
  if (minute && player) return `${minute} ${player}`;
  return minute || player || 'هدف';
}

export function findNearestMatchId(
  items: PublicSportMatch[],
  nowMs: number,
) {
  if (!items.length) return null;
  let bestId = items[0].id;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const match of items) {
    const kickoff = new Date(match.kickoffAt).getTime();
    if (Number.isNaN(kickoff)) continue;
    const elapsed = nowMs - kickoff;
    const score =
      elapsed >= 0 && elapsed <= 2 * 60 * 60 * 1000
        ? elapsed / 4
        : Math.abs(elapsed);
    if (score < bestScore) {
      bestScore = score;
      bestId = match.id;
    }
  }
  return bestId;
}

export type MatchDateGroup = {
  key: string;
  label: string;
  matches: PublicSportMatch[];
};

export function groupMatchesByDate(
  items: PublicSportMatch[],
): MatchDateGroup[] {
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
