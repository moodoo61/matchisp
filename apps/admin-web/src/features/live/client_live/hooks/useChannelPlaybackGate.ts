'use client';

import { useEffect, useState } from 'react';
import { getPublicChannelPlaybackReady } from '../api';
import {
  CHANNEL_WAKE_POLL_MS,
  CHANNEL_WAKE_TIMEOUT_MS,
  hasPlayableTsQualities,
  pingMistWakeUrl,
  planAfterWakeAttempt,
  planInitialPlayback,
  type PlaybackGatePhase,
} from '../lib/playbackGate';
import type { ViewingPlayerId } from '../lib/players';
import { resolveClientPlaybackUrl } from '../lib/resolveClientPlaybackUrl';
import type { PublicLiveChannel, TsQualityFromMist } from '../types';

export type ChannelPlaybackGateState = {
  phase: PlaybackGatePhase;
  player: ViewingPlayerId;
  /** روابط/جودات محدّثة بعد الإيقاظ */
  playback: PublicLiveChannel['playback'];
  online: 0 | 1 | 2 | null;
  active: boolean;
  useMainTsUrl: boolean;
  message: string | null;
  /** يمنع تركيب المشغّل حتى الجاهزية */
  allowPlayer: boolean;
};

type Options = {
  preferredPlayer: ViewingPlayerId;
  canFallbackToHls: boolean;
};

function buildInitial(channel: PublicLiveChannel, options: Options) {
  const plan = planInitialPlayback({
    preferredPlayer: options.preferredPlayer,
    online: channel.online,
    active: channel.active,
    tsQualities: channel.playback.tsQualities,
    canFallbackToHls: options.canFallbackToHls,
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
 * بوابة تشغيل: لا تُنشئ المشغّل لقناة نائمة/بدون جودات
 * حتى يكتمل الإيقاظ أو يُقرَّر الرابط الرئيسي / HLS.
 */
export function useChannelPlaybackGate(
  channel: PublicLiveChannel,
  options: Options,
): ChannelPlaybackGateState {
  const sessionKey = `${channel.id}:${options.preferredPlayer}`;
  const [session, setSession] = useState(sessionKey);
  const [state, setState] = useState(() => buildInitial(channel, options));

  /** إعادة ضبط البوابة فقط عند تغيير القناة أو المشغّل المطلوب */
  useEffect(() => {
    setSession(sessionKey);
    setState(buildInitial(channel, options));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- عمداً: sessionKey فقط
  }, [sessionKey]);

  /** أثناء الجاهزية: حدّث الروابط من polling الأب دون مسح جودات الإيقاظ */
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

    const abort = new AbortController();
    let cancelled = false;
    const startedAt = Date.now();
    const canFallbackToHls = options.canFallbackToHls;
    const wakeTsUrl = channel.playback.tsUrl;
    const wakeHlsUrl = channel.playback.hlsUrl;
    const channelId = channel.id;

    const wakeUrl = resolveClientPlaybackUrl(wakeTsUrl || wakeHlsUrl || '');
    if (wakeUrl) pingMistWakeUrl(wakeUrl, abort.signal);

    const finish = (
      plan: ReturnType<typeof planAfterWakeAttempt>,
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

    const poll = async () => {
      if (cancelled || abort.signal.aborted) return;
      const timedOut = Date.now() - startedAt >= CHANNEL_WAKE_TIMEOUT_MS;

      try {
        const ready = await getPublicChannelPlaybackReady(channelId);
        if (cancelled || abort.signal.aborted) return;

        const plan = planAfterWakeAttempt({
          online: ready.online,
          active: ready.active,
          tsQualities: ready.playback.tsQualities,
          tsReady: ready.tsReady,
          canFallbackToHls,
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
          window.setTimeout(() => void poll(), CHANNEL_WAKE_POLL_MS);
          return;
        }

        finish(plan, ready.playback, ready.online, ready.active);
      } catch {
        if (cancelled || abort.signal.aborted) return;
        if (!timedOut) {
          window.setTimeout(() => void poll(), CHANNEL_WAKE_POLL_MS);
          return;
        }
        finish(
          planAfterWakeAttempt({
            online: null,
            active: false,
            tsQualities: [],
            canFallbackToHls,
            timedOut: true,
          }),
          {
            hlsUrl: wakeHlsUrl,
            tsUrl: wakeTsUrl,
            whepUrl: channel.playback.whepUrl,
            tsQualities: channel.playback.tsQualities,
            token: channel.playback.token,
          },
          null,
          false,
        );
      }
    };

    void poll();

    return () => {
      cancelled = true;
      abort.abort();
    };
  }, [session, sessionKey, state.phase, channel.id, options.canFallbackToHls]);

  return {
    ...state,
    allowPlayer: state.phase === 'ready',
  };
}

/** جودات تُمرَّر للمشغّل — فارغة عند تشغيل الرابط الرئيسي */
export function gateTsQualities(
  playback: PublicLiveChannel['playback'],
  useMainTsUrl: boolean,
): TsQualityFromMist[] | undefined {
  if (useMainTsUrl) return [];
  return playback.tsQualities;
}
