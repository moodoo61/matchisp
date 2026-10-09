'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';
import type { PublicLiveChannel } from '../types';
import type { ViewingPlayerId } from '../lib/players';
import { resolveClientPlaybackUrl } from '../lib/resolveClientPlaybackUrl';
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

/** المسرح — المشغّل + شريط البرنامج */
export function ClientLiveStage({
  channel,
  brandLogoUrl,
  autoplay = false,
  onSelectChannel,
  activePlayer,
  onPlaybackError,
}: Props) {
  const rawUrl =
    activePlayer === 'ts'
      ? channel.playback.tsUrl ?? ''
      : channel.playback.hlsUrl;
  const srcUrl = resolveClientPlaybackUrl(rawUrl);

  /** تثبيت مرجع الجودات عبر بصمة المحتوى — polling الأقسام لا يعيد إنشاء المشغّل */
  const tsQualitiesKey = (channel.playback.tsQualities ?? [])
    .map((row) => `${row.width}x${row.height ?? 0}`)
    .join('|');
  const tsQualities = useMemo(
    () => channel.playback.tsQualities,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tsQualitiesKey],
  );

  useEffect(() => {
    if (!srcUrl && onPlaybackError) onPlaybackError();
  }, [srcUrl, onPlaybackError]);

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

      <ProgramBar channel={channel} onSelectChannel={onSelectChannel} />
    </section>
  );
}
