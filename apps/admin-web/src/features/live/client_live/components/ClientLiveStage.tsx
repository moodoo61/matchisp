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
 * المسرح — تشغيل فوري برابط Mist الرئيسي (التنشيط من طلب المشغّل)،
 * مع إثراء الجودات في الخلفية بلا رسالة تنشيط.
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

  const rawUrl =
    activePlayer === 'ts'
      ? enriched.playback.tsUrl ?? ''
      : enriched.playback.hlsUrl;
  const srcUrl = resolveClientPlaybackUrl(rawUrl);

  const tsQualitiesKey = (enriched.playback.tsQualities ?? [])
    .map((row) => `${row.width}x${row.height ?? 0}`)
    .join('|');
  const tsQualities = useMemo(
    () => gateTsQualities(enriched.playback),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tsQualitiesKey],
  );

  useEffect(() => {
    if (!srcUrl && onPlaybackError) onPlaybackError();
  }, [srcUrl, onPlaybackError]);

  const stageChannel = useMemo<PublicLiveChannel>(
    () => ({
      ...channel,
      online: enriched.online,
      active: enriched.active,
      playback: enriched.playback,
    }),
    [channel, enriched.online, enriched.active, enriched.playback],
  );

  return (
    <section className="cl-feature">
      <div className="cl-screen-shell">
        <div className="cl-screen">
          {srcUrl ? (
            <ClientLivePlayer
              key={`${channel.id}:${activePlayer}`}
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
