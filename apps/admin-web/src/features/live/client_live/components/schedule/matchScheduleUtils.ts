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

/** نافذة اعتبار المباراة جارية بعد الموعد إن لم تُحدَّث الحالة من المصدر */
const LIVE_WINDOW_MS = 2.5 * 60 * 60 * 1000;

export type MatchStatusTone =
  | 'live'
  | 'break'
  | 'upcoming'
  | 'finished'
  | 'cancelled';

function toneFromStatusText(raw: string): MatchStatusTone | null {
  if (!raw) return null;
  if (/انته|نهائ|full\s?-?time|finished|ended/.test(raw)) return 'finished';
  if (/ملغ|cancel|أ?جل|postpon/.test(raw)) return 'cancelled';
  if (
    /استراح|بين الشوط|half[\s-]?time|\bht\b|توقف مؤقت|paused/.test(raw)
  )
    return 'break';
  if (
    /جار|مباشر|\blive\b|الشوط الأول|الشوط الثاني|الشوط الاضافي|تمديد/.test(
      raw,
    )
  )
    return 'live';
  if (/لم تبدأ|قادم|لم تنطلق|scheduled|upcoming|not started/.test(raw))
    return 'upcoming';
  return null;
}

/** تقدير الحالة من الموعد عند غياب/تعارض نص المزامنة */
function toneFromKickoff(
  kickoffAt: string,
  nowMs: number,
): MatchStatusTone {
  const kickoff = new Date(kickoffAt).getTime();
  if (Number.isNaN(kickoff)) return 'upcoming';
  if (nowMs < kickoff) return 'upcoming';
  if (nowMs <= kickoff + LIVE_WINDOW_MS) return 'live';
  return 'finished';
}

/**
 * تصنيف الحالة: نص المزامنة الصريح أولاً، ثم الموعد تلقائياً.
 * «لم تبدأ» بعد انطلاق الموعد تُتجاوز لصالح التقدير الزمني.
 */
export function matchStatusTone(
  match: PublicSportMatch,
  nowMs = Date.now(),
): MatchStatusTone {
  const raw = (match.status ?? '').trim().toLowerCase();
  const fromText = toneFromStatusText(raw);
  const fromTime = toneFromKickoff(match.kickoffAt, nowMs);

  if (fromText === 'finished' || fromText === 'cancelled' || fromText === 'break') {
    return fromText;
  }
  if (fromText === 'live') return 'live';
  if (fromText === 'upcoming' && fromTime === 'upcoming') return 'upcoming';
  // نص غائب أو «لم تبدأ» بعد الموعد → الاعتماد على الوقت
  return fromTime;
}

export function matchHasStarted(match: PublicSportMatch, nowMs = Date.now()) {
  const tone = matchStatusTone(match, nowMs);
  return tone === 'live' || tone === 'break' || tone === 'finished';
}

export function matchCenterLabel(match: PublicSportMatch, nowMs = Date.now()) {
  if (matchHasStarted(match, nowMs)) {
    return `${match.homeGoals ?? 0} – ${match.awayGoals ?? 0}`;
  }
  return 'VS';
}

/** نص الحالة للعرض — صريح من المصدر أو مستنتج من الموعد */
export function matchStatusDisplay(
  match: PublicSportMatch,
  nowMs = Date.now(),
): string {
  const explicit = match.status?.trim();
  if (explicit && explicit !== 'لم تبدأ') return explicit;
  if (explicit === 'لم تبدأ' && matchStatusTone(match, nowMs) === 'upcoming') {
    return explicit;
  }
  switch (matchStatusTone(match, nowMs)) {
    case 'live':
      return 'جارية';
    case 'break':
      return 'استراحة';
    case 'finished':
      return 'انتهت';
    case 'cancelled':
      return explicit || 'ملغاة';
    default:
      return explicit || 'لم تبدأ';
  }
}

/** مباراة جارية الآن (مباشر أو استراحة بين الشوطين) */
export function isMatchLiveNow(
  match: PublicSportMatch,
  nowMs = Date.now(),
): boolean {
  const tone = matchStatusTone(match, nowMs);
  return tone === 'live' || tone === 'break';
}

/** سطر شريط المباريات المباشرة */
export function formatLiveMatchTickerLine(match: PublicSportMatch): string {
  const home = match.homeTeam.name.trim();
  const away = match.awayTeam.name.trim();
  const score = `${match.homeGoals ?? 0} – ${match.awayGoals ?? 0}`;
  return `${home} ${score} ${away}`;
}

/** أول قناة مربوطة بالمباراة (للانتقال من الشريط) */
export function matchPrimaryChannelId(
  match: PublicSportMatch,
): string | null {
  if (match.channels?.length) return match.channels[0]?.id ?? null;
  return match.channel?.id ?? null;
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
