'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PERMISSIONS } from '@isp/shared';
import { getMaintenanceMetrics } from '@/features/maintenance/api';
import type { MaintenanceMetrics } from '@/features/maintenance/types';
import { usePermissions } from '@/lib/usePermissions';
import { TaskCard } from '@/shared/ui';

export function MaintenanceMetricsCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.MAINTENANCE_READ);
  const [m, setM] = useState<MaintenanceMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canRead) return;
    void (async () => {
      try {
        setM(await getMaintenanceMetrics());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطأ');
      }
    })();
  }, [canRead]);

  if (!canRead) return null;

  const tiles = m
    ? [
        {
          label: 'بلاغات مفتوحة',
          value: m.openRequests,
          href: '/maintenance',
        },
        {
          label: 'أوامر نشطة',
          value: m.activeWorkOrders,
          href: '/maintenance/work-orders',
        },
        {
          label: 'بانتظار المراجعة',
          value: m.pendingReview,
          href: '/maintenance/review',
          hot: m.pendingReview > 0,
        },
        {
          label: 'بانتظار مواد',
          value: m.waitingParts,
          href: '/maintenance/parts',
        },
        {
          label: 'متأخرة عن الموعد',
          value: m.overdue,
          href: '/maintenance/work-orders',
          hot: m.overdue > 0,
        },
      ]
    : [];

  return (
    <TaskCard title="مؤشرات الصيانة">
      {error ? <p className="error">{error}</p> : null}
      {!m && !error ? <p className="muted">جاري التحميل…</p> : null}
      {m ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {tiles.map((t) => {
            const body = (
              <>
                <div
                  className="muted"
                  style={{ fontSize: '0.82rem', marginBottom: '0.35rem' }}
                >
                  {t.label}
                </div>
                <strong
                  style={{
                    fontSize: '1.45rem',
                    color: t.hot ? '#fca5a5' : undefined,
                  }}
                >
                  {t.value}
                </strong>
                {'hint' in t && t.hint ? (
                  <div className="muted" style={{ fontSize: '0.75rem' }}>
                    {t.hint}
                  </div>
                ) : null}
              </>
            );
            const style = {
              display: 'block' as const,
              padding: '0.85rem 0.9rem',
              border: '1px solid var(--border)',
              borderRadius: 12,
              background: 'var(--bg)',
              color: 'inherit',
              textDecoration: 'none',
            };
            return t.href ? (
              <Link key={t.label} href={t.href} style={style}>
                {body}
              </Link>
            ) : (
              <div key={t.label} style={style}>
                {body}
              </div>
            );
          })}
        </div>
      ) : null}
    </TaskCard>
  );
}
