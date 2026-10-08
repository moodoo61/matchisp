'use client';

import { useMemo } from 'react';
import type { PublicLiveChannel } from '../types';
import { resolveClientPlaybackUrl } from '../lib/resolveClientPlaybackUrl';
import { ClientLivePlayer } from './ClientLivePlayer';
import { ProgramBar } from './program/ProgramBar';

type Props = {
  channel: PublicLiveChannel;
  brandLogoUrl?: string | null;
  autoplay?: boolean;
  onSelectChannel?: (channelId: string) => void;
};

/** المسرح — المشغّل + شريط البرنامج */
export function ClientLiveStage({
  channel,
  brandLogoUrl,
  autoplay = false,
  onSelectChannel,
}: Props) {
  const hlsUrl = useMemo(
    () => resolveClientPlaybackUrl(channel.playback.hlsUrl),
    [channel.playback.hlsUrl],
  );

  return (
    <section className="cl-feature">
      <div className="cl-screen-shell">
        <div className="cl-screen">
          {hlsUrl ? (
            <ClientLivePlayer
              hlsUrl={hlsUrl}
              brandLogoUrl={brandLogoUrl}
              autoplay={autoplay}
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
