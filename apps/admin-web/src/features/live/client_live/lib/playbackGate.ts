import type { TsQualityFromMist } from '../types';
import type { ViewingPlayerId } from './players';

/** فترة استطلاع online/جودات أثناء التنشيط */
export const CHANNEL_WAKE_POLL_MS = 1000;

/** أقصى انتظار حتى يتحول Mist إلى online=1 ثم تتوفر الجودات */
export const CHANNEL_WAKE_TIMEOUT_MS = 30_000;

/** بعد online=1: انتظار إضافي لظهور مسارات الجودة قبل الرابط الرئيسي */
export const CHANNEL_QUALITIES_GRACE_MS = 5_000;

export type PlaybackGatePhase =
  | 'deciding'
  | 'waking'
  | 'ready'
  | 'failed';

export type PlaybackGatePlan = {
  phase: PlaybackGatePhase;
  needsWake: boolean;
  player: ViewingPlayerId;
  /** تشغيل TS بالرابط الرئيسي دون ?video= */
  useMainTsUrl: boolean;
  message: string | null;
};

/** جودات صالحة لـ Mist ?video=عرضxارتفاع */
export function hasPlayableTsQualities(
  qualities: TsQualityFromMist[] | null | undefined,
): boolean {
  if (!qualities?.length) return false;
  return qualities.some((row) => {
    const width = Number(row.width);
    const height = row.height == null ? NaN : Number(row.height);
    return (
      Number.isFinite(width) &&
      width > 0 &&
      Number.isFinite(height) &&
      height > 0
    );
  });
}

/**
 * أخضر Mist = online === 1 (نشط).
 * @see MistServer streams API: online 0=error, 1=active, 2=inactive
 */
export function isMistStreamOnline(online: 0 | 1 | 2 | null): boolean {
  return online === 1;
}

/**
 * قرار أولي: TS يحتاج تنشيطاً إن لم يكن أخضر أو بلا جودات.
 * لا يوجد تحويل تلقائي إلى HLS من البوابة.
 */
export function planInitialPlayback(input: {
  preferredPlayer: ViewingPlayerId;
  online: 0 | 1 | 2 | null;
  tsQualities: TsQualityFromMist[] | null | undefined;
}): PlaybackGatePlan {
  if (input.preferredPlayer === 'hls') {
    return {
      phase: 'ready',
      needsWake: false,
      player: 'hls',
      useMainTsUrl: false,
      message: null,
    };
  }

  const online = isMistStreamOnline(input.online);
  const qualitiesOk = hasPlayableTsQualities(input.tsQualities);

  if (online && qualitiesOk) {
    return {
      phase: 'ready',
      needsWake: false,
      player: 'ts',
      useMainTsUrl: false,
      message: null,
    };
  }

  return {
    phase: 'waking',
    needsWake: true,
    player: 'ts',
    useMainTsUrl: false,
    message: online
      ? 'القناة نشطة — جاري جلب مسارات الجودة…'
      : 'جاري تنشيط القناة عبر Mist…',
  };
}

/**
 * بعد عيّنة جاهزية من الـ API.
 * الترتيب: انتظر الأخضر → جودات → تشغيل؛ بلا HLS.
 */
export function planAfterWakeSample(input: {
  online: 0 | 1 | 2 | null;
  tsQualities: TsQualityFromMist[] | null | undefined;
  tsReady?: boolean;
  streamOnline?: boolean;
  /** مضى وقت منذ أن صارت online=1 */
  onlineForMs: number;
  timedOut: boolean;
}): PlaybackGatePlan {
  const online =
    input.streamOnline === true || isMistStreamOnline(input.online);
  const qualitiesOk =
    input.tsReady === true || hasPlayableTsQualities(input.tsQualities);

  if (online && qualitiesOk) {
    return {
      phase: 'ready',
      needsWake: false,
      player: 'ts',
      useMainTsUrl: false,
      message: null,
    };
  }

  if (online && input.onlineForMs >= CHANNEL_QUALITIES_GRACE_MS) {
    return {
      phase: 'ready',
      needsWake: false,
      player: 'ts',
      useMainTsUrl: true,
      message: null,
    };
  }

  if (online) {
    return {
      phase: 'waking',
      needsWake: true,
      player: 'ts',
      useMainTsUrl: false,
      message: 'القناة نشطة — جاري جلب مسارات الجودة…',
    };
  }

  if (input.timedOut) {
    return {
      phase: 'failed',
      needsWake: false,
      player: 'ts',
      useMainTsUrl: false,
      message: 'تعذر تنشيط القناة على Mist. حاول مرة أخرى.',
    };
  }

  return {
    phase: 'waking',
    needsWake: true,
    player: 'ts',
    useMainTsUrl: false,
    message: 'جاري تنشيط القناة عبر Mist…',
  };
}
