import { stripPlaybackToken } from './playbackUrlIdentity';
import { hasPlayableTsQualities } from './playbackGate';
import type { PublicLiveChannel, TsQualityFromMist } from '../types';

type Playback = PublicLiveChannel['playback'];

/** هل رابطا TS يشيران لنفس ستريم Mist (مع تجاهل التوكن) */
export function sameTsStream(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = stripPlaybackToken(a ?? '');
  const right = stripPlaybackToken(b ?? '');
  if (!left || !right) return false;
  try {
    const pa = new URL(left, 'http://local.invalid');
    const pb = new URL(right, 'http://local.invalid');
    return pa.pathname === pb.pathname;
  } catch {
    return left === right;
  }
}

/**
 * دمج تحديث تشغيل لقناة واحدة فقط.
 * ممنوع الإبقاء على جودات قناة أخرى عندما الواردة فارغة.
 */
export function mergeChannelPlayback(
  current: Playback,
  incoming: Playback,
): Playback {
  const incomingQ = incoming.tsQualities ?? [];
  if (hasPlayableTsQualities(incomingQ)) {
    return { ...incoming, tsQualities: incomingQ };
  }

  const currentQ = current.tsQualities ?? [];
  if (
    hasPlayableTsQualities(currentQ) &&
    sameTsStream(current.tsUrl, incoming.tsUrl)
  ) {
    return { ...incoming, tsQualities: currentQ };
  }

  return { ...incoming, tsQualities: incomingQ };
}

/** اقبل عيّنة جاهزية فقط إن طابقت معرف/اسم القناة الحالية */
export function isPlaybackReadyForChannel(
  ready: { id: string; name: string },
  channelId: string,
  streamName: string,
): boolean {
  return ready.id === channelId && ready.name === streamName;
}

export function qualitiesOrEmpty(
  qualities: TsQualityFromMist[] | null | undefined,
): TsQualityFromMist[] {
  return hasPlayableTsQualities(qualities) ? (qualities as TsQualityFromMist[]) : [];
}
