'use client';

import { useEffect, useState } from 'react';
import {
  getPublicChannelPlaybackReady,
  wakePublicChannel,
} from '../api';
import {
  CHANNEL_WAKE_POLL_MS,
  CHANNEL_WAKE_TIMEOUT_MS,
  hasPlayableTsQualities,
  isMistStreamOnline,
} from '../lib/playbackGate';
import type { ViewingPlayerId } from '../lib/players';
import type { PublicLiveChannel, TsQualityFromMist } from '../types';

export type ChannelPlaybackGateState = {
  player: ViewingPlayerId;
  playback: PublicLiveChannel['playback'];
  online: 0 | 1 | 2 | null;
  active: boolean;
};

type Options = {
  preferredPlayer: ViewingPlayerId;
};

/**
 * يشغّل فوراً بالرابط الرئيسي (طلب المشغّل = تنشيط Mist)،
 * وفي الخلفية: wake + استطلاع الجودات دون حجب الواجهة أو رسائل.
 */
export function useChannelPlaybackEnrichment(
  channel: PublicLiveChannel,
  options: Options,
): ChannelPlaybackGateState {
  const sessionKey = `${channel.id}:${options.preferredPlayer}`;
  const [session, setSession] = useState(sessionKey);
  const [playback, setPlayback] = useState(channel.playback);
  const [online, setOnline] = useState(channel.online);
  const [active, setActive] = useState(channel.active);

  useEffect(() => {
    setSession(sessionKey);
    setPlayback(channel.playback);
    setOnline(channel.online);
    setActive(channel.active);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sessionKey فقط
  }, [sessionKey]);

  /** دمج تحديثات قائمة الأقسام دون مسح جودات وصلت من الاستطلاع */
  useEffect(() => {
    if (session !== sessionKey) return;
    setOnline(channel.online);
    setActive(channel.active);
    setPlayback((current) => ({
      ...channel.playback,
      tsQualities: hasPlayableTsQualities(channel.playback.tsQualities)
        ? channel.playback.tsQualities
        : current.tsQualities,
    }));
  }, [session, sessionKey, channel.playback, channel.online, channel.active]);

  useEffect(() => {
    if (session !== sessionKey) return;
    if (options.preferredPlayer !== 'ts') return;

    let cancelled = false;
    const startedAt = Date.now();
    const channelId = channel.id;
    let gotQualities = hasPlayableTsQualities(channel.playback.tsQualities);
    let sawOnline = isMistStreamOnline(channel.online);

    const ingest = (
      ready: Awaited<ReturnType<typeof getPublicChannelPlaybackReady>>,
    ) => {
      if (cancelled) return;
      if (ready.streamOnline || ready.online === 1) sawOnline = true;
      if (hasPlayableTsQualities(ready.playback.tsQualities)) {
        gotQualities = true;
      }
      setOnline(ready.online);
      setActive(ready.active);
      setPlayback((current) => ({
        ...ready.playback,
        tsQualities: hasPlayableTsQualities(ready.playback.tsQualities)
          ? ready.playback.tsQualities
          : current.tsQualities,
      }));
    };

    const shouldStop = () =>
      cancelled ||
      Date.now() - startedAt >= CHANNEL_WAKE_TIMEOUT_MS ||
      (sawOnline && gotQualities);

    const poll = async () => {
      if (shouldStop()) return;
      try {
        const ready = await getPublicChannelPlaybackReady(channelId);
        ingest(ready);
      } catch {
        /* تجاهل — المشغّل يعمل بالرابط الرئيسي */
      }
      if (!shouldStop()) {
        window.setTimeout(() => void poll(), CHANNEL_WAKE_POLL_MS);
      }
    };

    void (async () => {
      try {
        const woke = await wakePublicChannel(channelId);
        ingest(woke);
      } catch {
        /* الإيقاظ السيرفري مساعد فقط */
      }
      if (!shouldStop()) {
        window.setTimeout(() => void poll(), CHANNEL_WAKE_POLL_MS);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, sessionKey, options.preferredPlayer, channel.id]);

  return {
    player: options.preferredPlayer,
    playback,
    online,
    active,
  };
}

/** @deprecated استخدم useChannelPlaybackEnrichment */
export const useChannelPlaybackGate = useChannelPlaybackEnrichment;

/** دائماً نمرّر الجودات للقائمة — التشغيل الافتراضي بدون ?video= عبر level=-1 */
export function gateTsQualities(
  playback: PublicLiveChannel['playback'],
  _useMainTsUrl?: boolean,
): TsQualityFromMist[] | undefined {
  return playback.tsQualities;
}
