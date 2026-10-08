'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  clearViewingSessions,
  getViewingReportsByDay,
} from '@/features/live/viewing_reports/api';
import {
  formatBytes,
  formatDayLabel,
  formatDuration,
} from '@/features/live/viewing_reports/lib/format';
import type { ViewingReportsDayRow } from '@/features/live/viewing_reports/types';
import { usePermissions } from '@/lib/usePermissions';
import { TaskCard, notifyMutation, useToast } from '@/shared/ui';

const PERIODS = [
  { hours: 24 * 7, label: '7 أيام' },
  { hours: 24 * 30, label: '30 يوماً' },
  { hours: 24 * 90, label: '90 يوماً' },
] as const;

/** جدول الأيام — الضغط يفتح تفاصيل الجلسات */
export function ViewingReportsDaysCard() {
  const toast = useToast();
  const { can } = usePermissions();
  const canDelete = can(PERMISSIONS.LIVE_VIEWING_REPORTS_DELETE);
  const [hours, setHours] = useState(24 * 30);
  const [days, setDays] = useState<ViewingReportsDayRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async (periodHours: number) => {
    setLoading(true);
    try {
      const next = await getViewingReportsByDay(periodHours);
      setDays(next.days);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر التحميل');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload(hours);
  }, [hours, reload]);

  const onClear = async () => {
    if (!canDelete || busy) return;
    if (!window.confirm('حذف كل سجلات تقارير المشاهدة؟')) return;
    setBusy(true);
    try {
      await notifyMutation(
        toast,
        async () => {
          const result = await clearViewingSessions();
          await reload(hours);
          return result;
        },
        { success: 'تم مسح السجلات' },
      );
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  };

  return (
    <TaskCard
      title="التقارير حسب اليوم"
      actions={
        <div className="viewing-reports-sessions-actions">
          <div className="viewing-reports-periods">
            {PERIODS.map((p) => (
              <button
                key={p.hours}
                type="button"
                className={`btn btn-sm${hours === p.hours ? '' : ' secondary'}`}
                onClick={() => setHours(p.hours)}
              >
                {p.label}
              </button>
            ))}
          </div>
          {canDelete ? (
            <button
              type="button"
              className="btn danger btn-sm"
              disabled={busy || !days.length}
              onClick={() => void onClear()}
            >
              مسح
            </button>
          ) : null}
        </div>
      }
    >
      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>عدد الجلسات</th>
              <th>إجمالي الوقت</th>
              <th>القنوات</th>
              <th>إجمالي التحميل</th>
            </tr>
          </thead>
          <tbody>
            {days.map((row) => (
              <tr key={row.day} className="viewing-reports-day-row">
                <td>
                  <Link
                    className="viewing-reports-day-link"
                    href={`/live/viewing-reports/days/${row.day}`}
                  >
                    {formatDayLabel(row.day)}
                  </Link>
                </td>
                <td>{row.sessions}</td>
                <td>{formatDuration(row.durationSec)}</td>
                <td>{row.channels}</td>
                <td dir="ltr">{formatBytes(row.downloadedBytes)}</td>
              </tr>
            ))}
            {!days.length && !loading ? (
              <tr>
                <td colSpan={5} className="muted">
                  لا توجد أيام في هذه الفترة
                </td>
              </tr>
            ) : null}
            {loading && !days.length ? (
              <tr>
                <td colSpan={5} className="muted">
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
