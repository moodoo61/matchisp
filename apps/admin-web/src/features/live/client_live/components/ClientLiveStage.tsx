'use client';

import { useMemo } from 'react';
import type { PublicLiveChannel } from '../types';
import { resolveClientPlaybackUrl } from '../lib/resolveClientPlaybackUrl';
import { ClientLivePlayer } from './ClientLivePlayer';

type Props = {
  channel: PublicLiveChannel;
  brandLogoUrl?: string | null;
  autoplay?: boolean;
};

function isLive(channel: PublicLiveChannel) {
  return channel.active || channel.online === 1;
}

/** المسرح — الفيديو وسطر معلومة واحد (لا تكرار) */
export function ClientLiveStage({
  channel,
  brandLogoUrl,
  autoplay = false,
}: Props) {
  const live = isLive(channel);
  const hlsUrl = useMemo(
    () => resolveClientPlaybackUrl(channel.playback.hlsUrl),
    [channel.playback.hlsUrl],
  );

  return (
    <section className="cl-feature" aria-live="polite">
      <div className="cl-screen-shell">
        <div className="cl-screen">
          {hlsUrl ? (
            <ClientLivePlayer
              hlsUrl={hlsUrl}
              posterUrl={channel.imageUrl}
              brandLogoUrl={brandLogoUrl}
              autoplay={autoplay}
            />
          ) : (
            <div className="cl-frame-empty">{channel.label}</div>
          )}
        </div>
      </div>

      <div className="cl-program">
        <div className="cl-program-channel">
          <span className="cl-program-mark">
            {channel.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={channel.imageUrl} alt="" />
            ) : (
              channel.label.slice(0, 1)
            )}
          </span>
          <div>
            <h1>{channel.label}</h1>
            <p className="cl-program-sub">{channel.section.label}</p>
          </div>
        </div>

        <span className={live ? 'cl-program-state is-live' : 'cl-program-state'}>
          <i aria-hidden />
          {live ? 'مباشر' : 'متوقف'}
        </span>
      </div>
    </section>
  );
}
