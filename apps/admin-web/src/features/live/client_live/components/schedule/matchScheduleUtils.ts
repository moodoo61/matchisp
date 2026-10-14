import type { PublicSportMatch, PublicSportMatchGoal } from '../../types';
import {
  DEFAULT_SCHEDULE_TIMEZONE,
  zonedDayKey,
} from '../../lib/scheduleTimezone';

export function formatMatchTime(
  iso: string,
  timeZone: string = DEFAULT_SCHEDULE_TIMEZONE,
) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('ar', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(d);
}

export function matchDateKey(
  iso: string,
  timeZone: string = DEFAULT_SCHEDULE_TIMEZONE,
) {
  return zonedDayKey(iso, timeZone);
}

export function formatMatchDateLabel(
  iso: string,
  timeZone: string = DEFAULT_SCHEDULE_TIMEZONE,
) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('ar', {
    timeZone,
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

/**
 * أقرب مباراة لـ «الآن» بالمقارنة المطلقة مع kickoffAt (ISO UTC).
 * تفضيل المباريات الجارية، ثم مباريات «اليوم» في المنطقة الزمنية المعطاة.
 */
export function findNearestMatchId(
  items: PublicSportMatch[],
  nowMs: number,
  timeZone: string = DEFAULT_SCHEDULE_TIMEZONE,
) {
  if (!items.length) return null;

  const todayKey = zonedDayKey(nowMs, timeZone);
  let bestId: string | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const match of items) {
    const kickoff = new Date(match.kickoffAt).getTime();
    if (Number.isNaN(kickoff)) continue;

    const elapsed = nowMs - kickoff;
    const abs = Math.abs(elapsed);
    const isLive = elapsed >= 0 && elapsed <= LIVE_WINDOW_MS;
    const isToday = matchDateKey(match.kickoffAt, timeZone) === todayKey;

    // جارية أولاً، ثم أقرب زمنياً، مع تفضيل خفيف لمباريات اليوم
    let score = abs;
    if (isLive) score = abs * 0.2;
    else if (isToday) score = abs * 0.85;

    if (score < bestScore) {
      bestScore = score;
      bestId = match.id;
    }
  }

  return bestId ?? items[0]?.id ?? null;
}

export type MatchDateGroup = {
  key: string;
  label: string;
  matches: PublicSportMatch[];
};

export function groupMatchesByDate(
  items: PublicSportMatch[],
  timeZone: string = DEFAULT_SCHEDULE_TIMEZONE,
): MatchDateGroup[] {
  const sorted = [...items].sort(
    (a, b) =>
      new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
  );
  const map = new Map<string, MatchDateGroup>();
  for (const match of sorted) {
    const key = matchDateKey(match.kickoffAt, timeZone);
    const existing = map.get(key);
    if (existing) {
      existing.matches.push(match);
      continue;
    }
    map.set(key, {
      key,
      label: formatMatchDateLabel(match.kickoffAt, timeZone),
      matches: [match],
    });
  }
  return [...map.values()];
}
