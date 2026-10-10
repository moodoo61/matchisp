'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';
import {
  gateTsQualities,
  useChannelPlaybackEnrichment,
} from '../hooks/useChannelPlaybackGate';
import type { ViewingPlayerId } from '../lib/players';
import { resolveClientPlaybackUrl } from '../lib/resolveClientPlaybackUrl';
import type { PublicLiveChannel } from '../types';
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

/**
 * المسرح — تشغيل قناة واحدة معزول:
 * الروابط/الجودات/الإيقاظ مربوطة بـ channel.id فقط.
 */
export function ClientLiveStage({
  channel,
  brandLogoUrl,
  autoplay = false,
  onSelectChannel,
  activePlayer,
  onPlaybackError,
}: Props) {
  const enriched = useChannelPlaybackEnrichment(channel, {
    preferredPlayer: activePlayer,
  });

  const boundOk =
    enriched.channelId === channel.id &&
    enriched.streamName === channel.name;

  const rawUrl = !boundOk
    ? ''
    : activePlayer === 'ts'
      ? enriched.playback.tsUrl ?? ''
      : enriched.playback.hlsUrl;
  const srcUrl = resolveClientPlaybackUrl(rawUrl);

  const tsQualities = useMemo(
    () =>
      gateTsQualities(
        enriched.playback,
        enriched.channelId,
        channel.id,
      ),
    [
      enriched.playback,
      enriched.channelId,
      channel.id,
      // بصمة الجودات لإعادة الحساب عند تغيّرها لهذه القناة فقط
      (enriched.playback.tsQualities ?? [])
        .map((row) => `${row.width}x${row.height ?? 0}`)
        .join('|'),
    ],
  );

  const qualitiesKey = (tsQualities ?? [])
    .map((row) => `${row.width}x${row.height ?? 0}`)
    .join('|');

  useEffect(() => {
    if (!boundOk) return;
    if (!srcUrl && onPlaybackError) onPlaybackError();
  }, [boundOk, srcUrl, onPlaybackError]);

  const stageChannel = useMemo<PublicLiveChannel>(
    () =>
      boundOk
        ? {
            ...channel,
            online: enriched.online,
            active: enriched.active,
            playback: enriched.playback,
          }
        : channel,
    [
      boundOk,
      channel,
      enriched.online,
      enriched.active,
      enriched.playback,
    ],
  );

  return (
    <section className="cl-feature">
      <div className="cl-screen-shell">
        <div className="cl-screen">
          {boundOk && srcUrl ? (
            <ClientLivePlayer
              key={`${channel.id}:${activePlayer}:${qualitiesKey || 'main'}`}
              mode={activePlayer}
              srcUrl={srcUrl}
              brandLogoUrl={brandLogoUrl}
              autoplay={autoplay}
              tsQualities={tsQualities}
              onPlaybackError={onPlaybackError}
            />
          ) : (
            <div className="cl-frame-empty">{channel.label}</div>
          )}
        </div>
      </div>

      <ProgramBar channel={stageChannel} onSelectChannel={onSelectChannel} />
    </section>
  );
}
