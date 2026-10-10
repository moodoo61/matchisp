'use client';

import { useEffect, useState } from 'react';
import {
  getPublicChannelPlaybackReady,
  wakePublicChannel,
} from '../api';
import {
  isPlaybackReadyForChannel,
  mergeChannelPlayback,
} from '../lib/channelPlaybackMerge';
import {
  CHANNEL_WAKE_POLL_MS,
  CHANNEL_WAKE_TIMEOUT_MS,
  hasPlayableTsQualities,
  isMistStreamOnline,
} from '../lib/playbackGate';
import type { ViewingPlayerId } from '../lib/players';
import type { PublicLiveChannel, TsQualityFromMist } from '../types';

export type ChannelPlaybackGateState = {
  /** معرف القناة المربوطة بهذه الحالة — لرفض التسريب */
  channelId: string;
  streamName: string;
  player: ViewingPlayerId;
  playback: PublicLiveChannel['playback'];
  online: 0 | 1 | 2 | null;
  active: boolean;
};

type Options = {
  preferredPlayer: ViewingPlayerId;
};

/**
 * إثراء تشغيل لقناة واحدة فقط:
 * wake + استطلاع الجاهزية مربوطان بـ channel.id / name،
 * بدون الاحتفاظ بجودات قناة أخرى.
 */
export function useChannelPlaybackEnrichment(
  channel: PublicLiveChannel,
  options: Options,
): ChannelPlaybackGateState {
  const channelId = channel.id;
  const streamName = channel.name;
  const sessionKey = `${channelId}:${options.preferredPlayer}`;

  const [session, setSession] = useState(sessionKey);
  const [boundId, setBoundId] = useState(channelId);
  const [boundName, setBoundName] = useState(streamName);
  const [playback, setPlayback] = useState(channel.playback);
  const [online, setOnline] = useState(channel.online);
  const [active, setActive] = useState(channel.active);

  /** إعادة ضبط كاملة عند تغيير القناة أو المشغّل */
  useEffect(() => {
    setSession(sessionKey);
    setBoundId(channelId);
    setBoundName(streamName);
    setPlayback({
      ...channel.playback,
      tsQualities: channel.playback.tsQualities ?? [],
    });
    setOnline(channel.online);
    setActive(channel.active);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- عمداً: sessionKey فقط
  }, [sessionKey]);

  /** تحديثات القائمة العامة — لنفس القناة فقط، بلا تسريب جودات */
  useEffect(() => {
    if (session !== sessionKey) return;
    if (channel.id !== boundId || channel.name !== boundName) return;

    setOnline(channel.online);
    setActive(channel.active);
    setPlayback((current) => mergeChannelPlayback(current, channel.playback));
  }, [
    session,
    sessionKey,
    boundId,
    boundName,
    channel.id,
    channel.name,
    channel.online,
    channel.active,
    channel.playback,
  ]);

  useEffect(() => {
    if (session !== sessionKey) return;
    if (options.preferredPlayer !== 'ts') return;
    if (channel.id !== boundId) return;

    let cancelled = false;
    const startedAt = Date.now();
    const id = boundId;
    const name = boundName;
    let gotQualities = hasPlayableTsQualities(channel.playback.tsQualities);
    let sawOnline = isMistStreamOnline(channel.online);

    const ingest = (
      ready: Awaited<ReturnType<typeof getPublicChannelPlaybackReady>>,
    ) => {
      if (cancelled) return;
      if (!isPlaybackReadyForChannel(ready, id, name)) return;

      if (ready.streamOnline || ready.online === 1) sawOnline = true;
      if (hasPlayableTsQualities(ready.playback.tsQualities)) {
        gotQualities = true;
      }

      setOnline(ready.online);
      setActive(ready.active);
      setPlayback((current) => mergeChannelPlayback(current, ready.playback));
    };

    const shouldStop = () =>
      cancelled ||
      Date.now() - startedAt >= CHANNEL_WAKE_TIMEOUT_MS ||
      (sawOnline && gotQualities);

    const poll = async () => {
      if (shouldStop()) return;
      try {
        const ready = await getPublicChannelPlaybackReady(id);
        if (cancelled) return;
        ingest(ready);
      } catch {
        /* المشغّل قد يعمل بالرابط الرئيسي لهذه القناة */
      }
      if (!shouldStop()) {
        window.setTimeout(() => void poll(), CHANNEL_WAKE_POLL_MS);
      }
    };

    void (async () => {
      try {
        const woke = await wakePublicChannel(id);
        if (cancelled) return;
        ingest(woke);
      } catch {
        /* مساعد فقط */
      }
      if (!shouldStop()) {
        window.setTimeout(() => void poll(), CHANNEL_WAKE_POLL_MS);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    session,
    sessionKey,
    boundId,
    boundName,
    options.preferredPlayer,
    channel.id,
  ]);

  return {
    channelId: boundId,
    streamName: boundName,
    player: options.preferredPlayer,
    playback,
    online,
    active,
  };
}

/** @deprecated استخدم useChannelPlaybackEnrichment */
export const useChannelPlaybackGate = useChannelPlaybackEnrichment;

/** جودات القناة المربوطة فقط — فارغة إن لم تُثبت لهذه القناة */
export function gateTsQualities(
  playback: PublicLiveChannel['playback'],
  boundChannelId: string,
  selectedChannelId: string,
): TsQualityFromMist[] | undefined {
  if (boundChannelId !== selectedChannelId) return [];
  if (!hasPlayableTsQualities(playback.tsQualities)) return [];
  return playback.tsQualities;
}
