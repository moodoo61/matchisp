'use client';

import { useMemo, useRef } from 'react';
import {
  useLiveMatchLines,
  type LiveTickerItem,
} from './useLiveMatchLines';
import { useTickerCycleLayout } from './useTickerCycleLayout';

type Props = {
  onSelectChannel?: (channelId: string) => void;
};

function TickerCycle({
  items,
  onSelectChannel,
  interactive,
}: {
  items: LiveTickerItem[];
  onSelectChannel?: (channelId: string) => void;
  interactive: boolean;
}) {
  return (
    <span className="cl-program-ticker-cycle" aria-hidden={interactive ? undefined : true}>
      {items.map((item, index) => {
        const linked = Boolean(item.channelId && onSelectChannel);
        return (
          <span key={item.id} className="cl-program-ticker-item">
            {index > 0 ? (
              <span className="cl-program-ticker-sep" aria-hidden>
                {' · '}
              </span>
            ) : null}
            {linked ? (
              <button
                type="button"
                className="cl-program-ticker-match"
                tabIndex={interactive ? 0 : -1}
                onClick={() => onSelectChannel?.(item.channelId!)}
              >
                {item.text}
              </button>
            ) : (
              <span className="cl-program-ticker-match is-plain">{item.text}</span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/** شريط متحرك للمباريات الجارية — نقرة تفتح القناة الناقلة */
export function LiveMatchesTicker({ onSelectChannel }: Props) {
  const items = useLiveMatchLines();
  const text = useMemo(
    () => (items.length ? items.map((item) => item.text).join('   ·   ') : ''),
    [items],
  );

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  useTickerCycleLayout(viewportRef, measureRef, trackRef, text);

  return (
    <div
      ref={viewportRef}
      className="cl-program-ticker"
      dir="ltr"
      aria-label="مباريات جارية"
    >
      {text ? (
        <>
          <span
            ref={measureRef}
            className="cl-program-ticker-measure"
            aria-hidden
          >
            {text}
          </span>
          <div ref={trackRef} className="cl-program-ticker-track">
            <TickerCycle
              items={items}
              onSelectChannel={onSelectChannel}
              interactive
            />
            <TickerCycle
              items={items}
              onSelectChannel={onSelectChannel}
              interactive={false}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
