import type { TsQualityFromMist } from '../types';
import type { ViewingPlayerId } from './players';

/** فترة استطلاع جاهزية القناة أثناء الإيقاظ */
export const CHANNEL_WAKE_POLL_MS = 1500;

/** أقصى انتظار لتنشيط القناة وجلب الجودات */
export const CHANNEL_WAKE_TIMEOUT_MS = 12_000;

export type PlaybackGatePhase =
  | 'deciding'
  | 'waking'
  | 'ready'
  | 'failed';

export type PlaybackGatePlan = {
  phase: PlaybackGatePhase;
  /** هل نحتاج إيقاظ/انتظار قبل إنشاء المشغّل */
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

/** القناة نشطة على Mist وجاهزة للتشغيل */
export function isChannelStreamLive(input: {
  online: 0 | 1 | 2 | null;
  active: boolean;
}): boolean {
  return input.online === 1 && input.active === true;
}

/**
 * قرار أولي قبل إنشاء المشغّل.
 * TS بدون جودات أو بقناة نائمة → إيقاظ؛ HLS يمر مباشرة.
 */
export function planInitialPlayback(input: {
  preferredPlayer: ViewingPlayerId;
  online: 0 | 1 | 2 | null;
  active: boolean;
  tsQualities: TsQualityFromMist[] | null | undefined;
  canFallbackToHls: boolean;
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

  const live = isChannelStreamLive(input);
  const qualitiesOk = hasPlayableTsQualities(input.tsQualities);

  if (live && qualitiesOk) {
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
    message: live
      ? 'جاري تجهيز مسارات الجودة…'
      : 'جاري تنشيط القناة…',
  };
}

/**
 * قرار بعد انتهاء الانتظار / وصول عيّنة جاهزية.
 * أولوية: TS بجودة → TS رابط رئيسي إن نشطت → HLS → فشل.
 */
export function planAfterWakeAttempt(input: {
  online: 0 | 1 | 2 | null;
  active: boolean;
  tsQualities: TsQualityFromMist[] | null | undefined;
  tsReady?: boolean;
  canFallbackToHls: boolean;
  timedOut: boolean;
}): PlaybackGatePlan {
  const live = isChannelStreamLive(input);
  const qualitiesOk =
    input.tsReady === true || hasPlayableTsQualities(input.tsQualities);

  if (live && qualitiesOk) {
    return {
      phase: 'ready',
      needsWake: false,
      player: 'ts',
      useMainTsUrl: false,
      message: null,
    };
  }

  if (live) {
    return {
      phase: 'ready',
      needsWake: false,
      player: 'ts',
      useMainTsUrl: true,
      message: null,
    };
  }

  if (input.timedOut && input.canFallbackToHls) {
    return {
      phase: 'ready',
      needsWake: false,
      player: 'hls',
      useMainTsUrl: false,
      message: null,
    };
  }

  if (input.timedOut) {
    return {
      phase: 'failed',
      needsWake: false,
      player: 'ts',
      useMainTsUrl: false,
      message: 'تعذر تنشيط القناة. حاول مرة أخرى.',
    };
  }

  return {
    phase: 'waking',
    needsWake: true,
    player: 'ts',
    useMainTsUrl: false,
    message: 'جاري تنشيط القناة…',
  };
}

/** طلب خفيف لإيقاظ ستريم Mist (الاستجابة قد تُحجب بـ CORS) */
export function pingMistWakeUrl(
  url: string,
  signal?: AbortSignal,
): void {
  const target = url.trim();
  if (!target || typeof fetch === 'undefined') return;
  void fetch(target, {
    method: 'GET',
    mode: 'no-cors',
    cache: 'no-store',
    credentials: 'omit',
    signal,
  }).catch(() => {
    /* الإيقاظ أفضل جهد — الفشل هنا متوقع أحياناً */
  });
}
