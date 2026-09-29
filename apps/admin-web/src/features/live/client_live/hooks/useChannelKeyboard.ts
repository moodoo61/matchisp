'use client';

import { useEffect } from 'react';

/** تنقّل بالقنوات عبر الأسهم عندما لا يكون التركيز داخل حقل إدخال */
export function useChannelKeyboard(
  channelIds: string[],
  selectedId: string | null,
  onSelect: (id: string) => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled || channelIds.length < 2) return;

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.tagName === 'VIDEO')
      ) {
        return;
      }

      const index = selectedId ? channelIds.indexOf(selectedId) : -1;
      if (index < 0) return;

      if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const next = channelIds[(index + 1) % channelIds.length];
        if (next) onSelect(next);
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
        event.preventDefault();
        const prev =
          channelIds[(index - 1 + channelIds.length) % channelIds.length];
        if (prev) onSelect(prev);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [channelIds, selectedId, onSelect, enabled]);
}
