'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import { getChannelsOverview } from '@/features/live/api';
import type { ChannelsOverview } from '@/features/live/types';
import { usePermissions } from '@/lib/usePermissions';

export function ChannelsOverviewCards() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.LIVE_CHANNELS_READ);
  const [data, setData] = useState<ChannelsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setData(await getChannelsOverview());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب النظرة العامة');
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
    const timer = window.setInterval(() => void reload(), 15000);
    return () => window.clearInterval(timer);
  }, [canRead, reload]);

  if (!canRead) return null;
  if (error) return <p className="error">{error}</p>;
  if (!data) return null;

  return (
    <div className="grid-stats cols-3">
      <div className="card">
        <p className="stat-label">حالة الخادم الخلفي</p>
        <p
          className={`stat-value ${
            data.mistserver.available ? 'stat-ok' : 'stat-bad'
          }`}
        >
          {data.mistserver.available ? 'متصل' : 'غير متصل'}
        </p>
      </div>
      <div className="card">
        <p className="stat-label">القنوات النشطة</p>
        <p className="stat-value">
          {data.activeChannels}
          <span className="stat-suffix"> / {data.totalChannels}</span>
        </p>
      </div>
      <div className="card">
        <p className="stat-label">المشاهدون</p>
        <p className="stat-value">{data.viewers}</p>
      </div>
    </div>
  );
}
