'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';
import {
  gateTsQualities,
  useChannelPlaybackGate,
} from '../hooks/useChannelPlaybackGate';
import type { ViewingPlayerId } from '../lib/players';
import { resolveClientPlaybackUrl } from '../lib/resolveClientPlaybackUrl';
import type { PublicLiveChannel } from '../types';
import { ChannelWakeOverlay } from './ChannelWakeOverlay';
import { ProgramBar } from './program/ProgramBar';

/** مشغّل المتصفح فقط — mpegts.js لا يعمل على SSR */
const ClientLivePlayer = dynamic(
  () =>
    import('./ClientLivePlayer').then((mod) => mod.ClientLivePlayer),
  { ssr: false },
);

type Props = {
  channel: PublicLiveChannel;
  brandLogoUrl?: string | null;
  autoplay?: boolean;
  onSelectChannel?: (channelId: string) => void;
  activePlayer: ViewingPlayerId;
  onPlaybackError?: () => void;
};

/** المسرح — بوابة تنشيط Mist ثم المشغّل + شريط البرنامج */
export function ClientLiveStage({
  channel,
  brandLogoUrl,
  autoplay = false,
  onSelectChannel,
  activePlayer,
  onPlaybackError,
}: Props) {
  const gate = useChannelPlaybackGate(channel, {
    preferredPlayer: activePlayer,
  });

  const rawUrl =
    gate.player === 'ts'
      ? gate.playback.tsUrl ?? ''
      : gate.playback.hlsUrl;
  const srcUrl = resolveClientPlaybackUrl(rawUrl);

  const tsQualitiesKey = (gate.playback.tsQualities ?? [])
    .map((row) => `${row.width}x${row.height ?? 0}`)
    .join('|');
  const tsQualities = useMemo(
    () => gateTsQualities(gate.playback, gate.useMainTsUrl),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tsQualitiesKey, gate.useMainTsUrl],
  );

  useEffect(() => {
    if (!gate.allowPlayer) return;
    if (!srcUrl && onPlaybackError) onPlaybackError();
  }, [gate.allowPlayer, srcUrl, onPlaybackError]);

  const stageChannel = useMemo<PublicLiveChannel>(
    () => ({
      ...channel,
      online: gate.online,
      active: gate.active,
      playback: gate.playback,
    }),
    [channel, gate.online, gate.active, gate.playback],
  );

  return (
    <section className="cl-feature">
      <div className="cl-screen-shell">
        <div className="cl-screen">
          {gate.phase === 'waking' || gate.phase === 'deciding' ? (
            <ChannelWakeOverlay
              message={gate.message ?? 'جاري تنشيط القناة عبر Mist…'}
            />
          ) : null}
          {gate.phase === 'failed' ? (
            <ChannelWakeOverlay
              failed
              message={gate.message ?? 'تعذر تنشيط القناة'}
            />
          ) : null}
          {gate.allowPlayer && srcUrl ? (
            <ClientLivePlayer
              key={`${channel.id}:${gate.player}:${gate.useMainTsUrl ? 'main' : 'q'}`}
              mode={gate.player}
              srcUrl={srcUrl}
              brandLogoUrl={brandLogoUrl}
              autoplay={autoplay}
              tsQualities={tsQualities}
              onPlaybackError={onPlaybackError}
            />
          ) : null}
          {gate.allowPlayer && !srcUrl ? (
            <div className="cl-frame-empty">{channel.label}</div>
          ) : null}
        </div>
      </div>

      <ProgramBar channel={stageChannel} onSelectChannel={onSelectChannel} />
    </section>
  );
}
