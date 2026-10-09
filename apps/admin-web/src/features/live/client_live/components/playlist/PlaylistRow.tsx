'use client';

import {
  VIEWING_PLAYER_LABELS,
  type ViewingPlayerId,
} from '../../lib/players';
import type { PublicLiveChannel } from '../../types';

function isLive(channel: PublicLiveChannel) {
  return channel.active || channel.online === 1;
}

type Props = {
  channel: PublicLiveChannel;
  selected: boolean;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
  players: ViewingPlayerId[];
  activePlayer: ViewingPlayerId;
  onSelect: (id: string) => void;
  onSelectPlayer: (id: string, player: ViewingPlayerId) => void;
};

/**
 * صف قائمة: زر اختيار يغطي الشعار+الاسم+المساحة الفارغة،
 * وأزرار المشغّل بجانب الاسم بارتفاع الاسم (بدون تداخل أزرار).
 */
export function PlaylistRow({
  channel,
  selected,
  buttonRef,
  players,
  activePlayer,
  onSelect,
  onSelectPlayer,
}: Props) {
  const live = isLive(channel);
  const showPlayers = selected && players.length > 1;

  return (
    <li>
      <div
        className={[
          'cl-row',
          selected ? 'is-selected' : '',
          showPlayers ? 'has-players' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <button
          type="button"
          className="cl-row-select"
          aria-current={selected ? 'true' : undefined}
          ref={buttonRef}
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
          {!showPlayers ? (
            <span className="cl-row-select-grow" aria-hidden />
          ) : null}
        </button>

        {showPlayers ? (
          <div
            className="cl-row-players"
            role="group"
            aria-label="المشغّل"
          >
            {players.map((id) => (
              <button
                key={id}
                type="button"
                className={`cl-row-player-btn${activePlayer === id ? ' is-active' : ''}`}
                aria-pressed={activePlayer === id}
                onClick={() => onSelectPlayer(channel.id, id)}
              >
                {VIEWING_PLAYER_LABELS[id]}
              </button>
            ))}
          </div>
        ) : null}

        <span
          className={live ? 'cl-row-dot is-live' : 'cl-row-dot'}
          aria-hidden
        />
      </div>
    </li>
  );
}
