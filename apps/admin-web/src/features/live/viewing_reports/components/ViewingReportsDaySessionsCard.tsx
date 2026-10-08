'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { listViewingSessions } from '@/features/live/viewing_reports/api';
import {
  formatBytes,
  formatDayLabel,
  formatDuration,
} from '@/features/live/viewing_reports/lib/format';
import type { ViewingSessionReport } from '@/features/live/viewing_reports/types';
import { IconChevron, TaskCard } from '@/shared/ui';

const PAGE_SIZE = 10;

type Props = { day: string };

/** تفاصيل جلسات يوم واحد */
export function ViewingReportsDaySessionsCard({ day }: Props) {
  const [items, setItems] = useState<ViewingSessionReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  const reload = useCallback(
    async (pageIndex: number) => {
      setLoading(true);
      try {
        const list = await listViewingSessions({
          day,
          limit: PAGE_SIZE,
          offset: pageIndex * PAGE_SIZE,
        });
        setItems(list.items);
        setTotal(list.total);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'تعذر التحميل');
      } finally {
        setLoading(false);
      }
    },
    [day],
  );

  useEffect(() => {
    setPage(0);
  }, [day]);

  useEffect(() => {
    void reload(safePage);
  }, [reload, safePage]);

  const from = total === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const to = Math.min(total, (safePage + 1) * PAGE_SIZE);

  return (
    <TaskCard
      title={`جلسات ${formatDayLabel(day)}`}
      actions={
        <div className="viewing-reports-sessions-actions">
          <Link className="btn secondary btn-sm" href="/live/viewing-reports">
            رجوع
          </Link>
          <div className="viewing-reports-pager">
            <button
              type="button"
              className="icon-btn tone-default"
              disabled={loading || safePage <= 0}
              title="السابق"
              aria-label="السابق"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <IconChevron style={{ transform: 'rotate(90deg)' }} />
            </button>
            <span className="viewing-reports-pager-meta">
              {total ? `${from}–${to} / ${total}` : '0'}
            </span>
            <button
              type="button"
              className="icon-btn tone-default"
              disabled={loading || safePage >= totalPages - 1}
              title="التالي"
              aria-label="التالي"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <IconChevron style={{ transform: 'rotate(-90deg)' }} />
            </button>
          </div>
        </div>
      }
    >
      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>القناة</th>
              <th>المدة</th>
              <th>التحميل</th>
              <th>البروتوكول</th>
              <th>العنوان</th>
              <th>انتهت</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>{row.channelLabel || row.streamName}</td>
                <td>{formatDuration(row.durationSec)}</td>
                <td dir="ltr">{formatBytes(row.downloadedBytes)}</td>
                <td>{row.connector || '—'}</td>
                <td dir="ltr">{row.connectionAddress || '—'}</td>
                <td>
                  {new Date(row.endedAt).toLocaleString('ar', {
                    timeZone: 'Asia/Baghdad',
                  })}
                </td>
              </tr>
            ))}
            {!items.length && !loading ? (
              <tr>
                <td colSpan={6} className="muted">
                  لا توجد جلسات لهذا اليوم
                </td>
              </tr>
            ) : null}
            {loading && !items.length ? (
              <tr>
                <td colSpan={6} className="muted">
                  جاري التحميل…
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </TaskCard>
  );
}
