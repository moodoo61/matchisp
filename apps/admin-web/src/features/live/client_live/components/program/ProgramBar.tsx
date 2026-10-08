'use client';

import type { PublicLiveChannel } from '../../types';
import { LiveMatchesTicker } from './LiveMatchesTicker';
import { ProgramChannelInfo } from './ProgramChannelInfo';
import { ProgramLiveBadge } from './ProgramLiveBadge';

type Props = {
  channel: PublicLiveChannel;
  onSelectChannel?: (channelId: string) => void;
};

function isChannelLive(channel: PublicLiveChannel) {
  return channel.active || channel.online === 1;
}

/** شريط أسفل المشغّل: قناة | مباريات جارية | حالة */
export function ProgramBar({ channel, onSelectChannel }: Props) {
  return (
    <div className="cl-program">
      <ProgramChannelInfo channel={channel} />
      <LiveMatchesTicker onSelectChannel={onSelectChannel} />
      <ProgramLiveBadge live={isChannelLive(channel)} />
    </div>
  );
}
