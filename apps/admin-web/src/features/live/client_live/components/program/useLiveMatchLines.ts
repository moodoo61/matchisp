'use client';

import { useEffect, useMemo, useState } from 'react';
import { listPublicTodayMatches } from '../../api';
import type { PublicSportMatch } from '../../types';
import {
  formatLiveMatchTickerLine,
  isMatchLiveNow,
  matchPrimaryChannelId,
} from '../schedule/matchScheduleUtils';

const REFRESH_MS = 45_000;

export type LiveTickerItem = {
  id: string;
  text: string;
  channelId: string | null;
};

/** جلب وفلترة أسطر المباريات الجارية للشريط */
export function useLiveMatchLines() {
  const [items, setItems] = useState<PublicSportMatch[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      void listPublicTodayMatches()
        .then((list) => {
          if (!cancelled) setItems(list);
        })
        .catch(() => {
          if (!cancelled) setItems([]);
        });
    };

    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return useMemo((): LiveTickerItem[] => {
    const rows: LiveTickerItem[] = [];
    for (const match of items) {
      if (!isMatchLiveNow(match)) continue;
      const text = formatLiveMatchTickerLine(match);
      if (!text) continue;
      rows.push({
        id: match.id,
        text,
        channelId: matchPrimaryChannelId(match),
      });
    }
    return rows;
  }, [items]);
}
