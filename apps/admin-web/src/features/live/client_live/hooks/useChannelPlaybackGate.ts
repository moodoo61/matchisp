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
  planAfterWakeSample,
  planInitialPlayback,
  type PlaybackGatePhase,
} from '../lib/playbackGate';
import type { ViewingPlayerId } from '../lib/players';
import type { PublicLiveChannel, TsQualityFromMist } from '../types';

export type ChannelPlaybackGateState = {
  phase: PlaybackGatePhase;
  player: ViewingPlayerId;
  playback: PublicLiveChannel['playback'];
  online: 0 | 1 | 2 | null;
  active: boolean;
  useMainTsUrl: boolean;
  message: string | null;
  allowPlayer: boolean;
};

type Options = {
  preferredPlayer: ViewingPlayerId;
};

function buildInitial(channel: PublicLiveChannel, options: Options) {
  const plan = planInitialPlayback({
    preferredPlayer: options.preferredPlayer,
    online: channel.online,
    tsQualities: channel.playback.tsQualities,
  });
  return {
    phase: plan.phase as PlaybackGatePhase,
    player: plan.player,
    playback: channel.playback,
    online: channel.online,
    active: channel.active,
    useMainTsUrl: plan.useMainTsUrl,
    message: plan.message,
  };
}

/**
 * بوابة تشغيل وفق نموذج MistServer:
 * 1) طلب رابط التشغيل من الـ API لإيقاظ الستريم (output يطلب المدخل)
 * 2) انتظار online=1 (أخضر)
 * 3) جلب جودات TS ثم تشغيل المشغّل
 * بلا تحويل تلقائي إلى HLS.
 */
export function useChannelPlaybackGate(
  channel: PublicLiveChannel,
  options: Options,
): ChannelPlaybackGateState {
  const sessionKey = `${channel.id}:${options.preferredPlayer}`;
  const [session, setSession] = useState(sessionKey);
  const [state, setState] = useState(() => buildInitial(channel, options));

  useEffect(() => {
    setSession(sessionKey);
    setState(buildInitial(channel, options));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sessionKey فقط
  }, [sessionKey]);

  useEffect(() => {
    if (session !== sessionKey) return;
    if (state.phase !== 'ready') return;
    setState((current) => ({
      ...current,
      online: channel.online,
      active: channel.active,
      playback: {
        ...channel.playback,
        tsQualities: hasPlayableTsQualities(channel.playback.tsQualities)
          ? channel.playback.tsQualities
          : current.playback.tsQualities,
      },
    }));
  }, [
    session,
    sessionKey,
    state.phase,
    channel.playback,
    channel.online,
    channel.active,
  ]);

  useEffect(() => {
    if (session !== sessionKey) return;
    if (state.phase !== 'waking') return;

    let cancelled = false;
    const startedAt = Date.now();
    let onlineSince: number | null = null;
    const channelId = channel.id;
    const wakeTsUrl = channel.playback.tsUrl;
    const wakeHlsUrl = channel.playback.hlsUrl;
    const wakeWhep = channel.playback.whepUrl;
    const wakeToken = channel.playback.token;
    const initialQualities = channel.playback.tsQualities;

    const finish = (
      plan: ReturnType<typeof planAfterWakeSample>,
      nextPlayback: PublicLiveChannel['playback'],
      nextOnline: 0 | 1 | 2 | null,
      nextActive: boolean,
    ) => {
      if (cancelled) return;
      setState({
        phase: plan.phase,
        player: plan.player,
        playback: nextPlayback,
        online: nextOnline,
        active: nextActive,
        useMainTsUrl: plan.useMainTsUrl,
        message: plan.message,
      });
    };

    const applySample = (
      ready: Awaited<ReturnType<typeof getPublicChannelPlaybackReady>>,
      timedOut: boolean,
    ) => {
      if (ready.streamOnline || ready.online === 1) {
        if (onlineSince == null) onlineSince = Date.now();
      } else {
        onlineSince = null;
      }

      const plan = planAfterWakeSample({
        online: ready.online,
        streamOnline: ready.streamOnline,
        tsQualities: ready.playback.tsQualities,
        tsReady: ready.tsReady,
        onlineForMs: onlineSince == null ? 0 : Date.now() - onlineSince,
        timedOut,
      });

      if (plan.phase === 'waking' && !timedOut) {
        setState((current) => ({
          ...current,
          playback: ready.playback,
          online: ready.online,
          active: ready.active,
          message: plan.message,
        }));
        return false;
      }

      finish(plan, ready.playback, ready.online, ready.active);
      return true;
    };

    const poll = async () => {
      if (cancelled) return;
      const timedOut = Date.now() - startedAt >= CHANNEL_WAKE_TIMEOUT_MS;

      try {
        const ready = await getPublicChannelPlaybackReady(channelId);
        if (cancelled) return;
        const done = applySample(ready, timedOut);
        if (!done) {
          window.setTimeout(() => void poll(), CHANNEL_WAKE_POLL_MS);
        }
      } catch {
        if (cancelled) return;
        if (!timedOut) {
          window.setTimeout(() => void poll(), CHANNEL_WAKE_POLL_MS);
          return;
        }
        finish(
          planAfterWakeSample({
            online: null,
            streamOnline: false,
            tsQualities: [],
            onlineForMs: 0,
            timedOut: true,
          }),
          {
            hlsUrl: wakeHlsUrl,
            tsUrl: wakeTsUrl,
            whepUrl: wakeWhep,
            tsQualities: initialQualities,
            token: wakeToken,
          },
          null,
          false,
        );
      }
    };

    void (async () => {
      try {
        // طلب رابط التشغيل من Mist عبر الـ API — يبقي output مفتوحاً حتى يلتقط المشغّل
        const woke = await wakePublicChannel(channelId);
        if (cancelled) return;
        const done = applySample(woke, false);
        if (!done) {
          window.setTimeout(() => void poll(), CHANNEL_WAKE_POLL_MS);
        }
      } catch {
        if (cancelled) return;
        window.setTimeout(() => void poll(), CHANNEL_WAKE_POLL_MS);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, sessionKey, state.phase, channel.id]);

  return {
    ...state,
    allowPlayer: state.phase === 'ready',
  };
}

export function gateTsQualities(
  playback: PublicLiveChannel['playback'],
  useMainTsUrl: boolean,
): TsQualityFromMist[] | undefined {
  if (useMainTsUrl) return [];
  return playback.tsQualities;
}
