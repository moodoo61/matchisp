'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PERMISSIONS } from '@isp/shared';
import { getInventorySummary } from '@/features/inventory/api';
import type { InventorySummary } from '@/features/inventory/types';
import {
  DOC_STATUS_LABELS,
  DOC_TYPE_LABELS,
  formatDt,
} from '@/features/inventory/types';
import { usePermissions } from '@/lib/usePermissions';
import { TaskCard } from '@/shared/ui';

export function InventoryDashboardCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.INVENTORY_READ);
  const [s, setS] = useState<InventorySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canRead) return;
    void (async () => {
      try {
        setS(await getInventorySummary());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطأ');
      }
    })();
  }, [canRead]);

  if (!canRead) return null;

  const tiles = s
    ? [
        { label: 'أصناف نشطة', value: s.activeItems, href: '/inventory/items' },
        {
          label: 'إجمالي الكميات',
          value: s.totalQuantity,
          href: '/inventory/items',
        },
        {
          label: 'أجهزة في المخزن',
          value: s.devicesInStock,
          href: '/inventory/devices?status=in_stock',
        },
        {
          label: 'أجهزة مصروفة',
          value: s.devicesIssued,
          href: '/inventory/devices?status=issued',
        },
        {
          label: 'أجهزة مركّبة',
          value: s.devicesInstalled,
          href: '/inventory/devices?status=installed',
        },
        {
          label: 'تحت الحد الأدنى',
          value: s.lowStockCount,
          href: '/inventory/items',
          hot: s.lowStockCount > 0,
        },
      ]
    : [];

  return (
    <div className="task-stack">
      <TaskCard
        title={s ? s.warehouse.name : 'المخزن'}
        actions={
          <div className="row-actions">
            <Link href="/inventory/documents?type=receipt" className="btn">
              توريد
            </Link>
            <Link href="/inventory/documents?type=issue" className="btn">
              صرف
            </Link>
          </div>
        }
      >
        {error ? <p className="error">{error}</p> : null}
        {!s && !error ? <p className="muted">جاري التحميل…</p> : null}
        {s ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {tiles.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                style={{
                  display: 'block',
                  padding: '0.85rem 0.9rem',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  background: 'var(--bg)',
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <div className="muted" style={{ fontSize: '0.82rem' }}>
                  {t.label}
                </div>
                <strong
                  style={{
                    fontSize: '1.4rem',
                    color: t.hot ? '#fca5a5' : undefined,
                  }}
                >
                  {t.value}
                </strong>
              </Link>
            ))}
          </div>
        ) : null}
      </TaskCard>

      {s?.lowStock.length ? (
        <TaskCard title="تنبيه حد أدنى">
          <ul style={{ margin: 0, paddingInlineStart: '1.1rem' }}>
            {s.lowStock.map((row) => (
              <li key={row.itemId}>
                {row.code} — {row.name}: {row.quantity} (حد {row.minQty})
              </li>
            ))}
          </ul>
        </TaskCard>
      ) : null}

      {s?.recentDocuments.length ? (
        <TaskCard title="آخر المستندات">
          <ul style={{ margin: 0, paddingInlineStart: '1.1rem' }}>
            {s.recentDocuments.map((d) => (
              <li key={d.id} style={{ marginBottom: '0.35rem' }}>
                <Link href={`/inventory/documents`}>
                  #{d.number} {DOC_TYPE_LABELS[d.type] ?? d.type}
                </Link>
                <span className="muted">
                  {' '}
                  · {DOC_STATUS_LABELS[d.status] ?? d.status} ·{' '}
                  {formatDt(d.postedAt ?? d.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </TaskCard>
      ) : null}
    </div>
  );
}
