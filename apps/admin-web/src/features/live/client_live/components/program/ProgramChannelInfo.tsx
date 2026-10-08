'use client';

import type { PublicLiveChannel } from '../../types';

type Props = {
  channel: PublicLiveChannel;
};

/** كتلة اسم القناة وشعارها — لا تنكمش أمام الشريط */
export function ProgramChannelInfo({ channel }: Props) {
  return (
    <div className="cl-program-channel">
      <span className="cl-program-mark">
        {channel.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={channel.imageUrl} alt="" />
        ) : (
          channel.label.slice(0, 1)
        )}
      </span>
      <h1 className="cl-program-channel-title">{channel.label}</h1>
    </div>
  );
}
