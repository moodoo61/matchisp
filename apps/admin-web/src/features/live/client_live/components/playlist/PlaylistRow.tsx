'use client';

import type { PublicLiveChannel } from '../../types';

function isLive(channel: PublicLiveChannel) {
  return channel.active || channel.online === 1;
}

type Props = {
  channel: PublicLiveChannel;
  selected: boolean;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
  onSelect: (id: string) => void;
};

/** صف واحد في قائمة التشغيل — الشعار والاسم ونقطة الحالة فقط */
export function PlaylistRow({ channel, selected, buttonRef, onSelect }: Props) {
  const live = isLive(channel);

  return (
    <li>
      <button
        type="button"
        ref={buttonRef}
        className={selected ? 'cl-row is-selected' : 'cl-row'}
        aria-current={selected ? 'true' : undefined}
        onClick={() => onSelect(channel.id)}
      >
        <span className="cl-row-mark">
          {channel.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={channel.imageUrl} alt="" loading="lazy" />
          ) : (
            channel.label.slice(0, 1)
          )}
        </span>
        <span className="cl-row-copy">
          <strong>{channel.label}</strong>
        </span>
        <span className={live ? 'cl-row-dot is-live' : 'cl-row-dot'} aria-hidden />
      </button>
    </li>
  );
}
