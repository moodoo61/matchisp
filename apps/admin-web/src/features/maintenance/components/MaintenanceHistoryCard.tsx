'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PERMISSIONS } from '@isp/shared';
import {
  listAssetKinds,
  listAssets,
  listRequestTypes,
  listWorkOrderHistory,
  type MetaOption,
} from '@/features/maintenance/api';
import type { Asset, WorkOrder } from '@/features/maintenance/types';
import {
  ASSET_KIND_LABELS,
  PRIORITY_LABELS,
  WO_TYPE_LABELS,
  formatDt,
} from '@/features/maintenance/types';
import { usePermissions } from '@/lib/usePermissions';
import { DataTable, TaskCard, type Column } from '@/shared/ui';

export function MaintenanceHistoryCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.MAINTENANCE_READ);
  const searchParams = useSearchParams();
  const initialAssetId = searchParams.get('assetId') ?? '';

  const [items, setItems] = useState<WorkOrder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [kinds, setKinds] = useState<MetaOption[]>([]);
  const [types, setTypes] = useState<MetaOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [assetId, setAssetId] = useState(initialAssetId);
  const [assetKind, setAssetKind] = useState('');
  const [type, setType] = useState('');
  const [q, setQ] = useState('');

  async function load(filters?: {
    assetId?: string;
    assetKind?: string;
    type?: string;
    q?: string;
  }) {
    setLoading(true);
    try {
      const rows = await listWorkOrderHistory(filters);
      setItems(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canRead) return;
    void (async () => {
      try {
        const [a, k, t] = await Promise.all([
          listAssets(),
          listAssetKinds(),
          listRequestTypes(),
        ]);
        setAssets(a);
        setKinds(k);
        setTypes(t);
      } catch {
        /* ignore meta errors */
      }
      await load({
        assetId: initialAssetId || undefined,
      });
    })();
  }, [canRead, initialAssetId]);

  if (!canRead) return null;

  function onFilter(e: FormEvent) {
    e.preventDefault();
    void load({
      assetId: assetId || undefined,
      assetKind: assetKind || undefined,
      type: type || undefined,
      q: q || undefined,
    });
  }

  const columns: Column<WorkOrder>[] = [
    {
      key: 'number',
      header: 'الرقم',
      render: (r) => (
        <Link href={`/maintenance/work-orders/${r.id}`}>#{r.number}</Link>
      ),
    },
    {
      key: 'title',
      header: 'العنوان',
      render: (r) => r.title,
    },
    {
      key: 'type',
      header: 'النوع',
      render: (r) => WO_TYPE_LABELS[r.type] ?? r.type,
    },
    {
      key: 'priority',
      header: 'الأولوية',
      render: (r) => PRIORITY_LABELS[r.priority] ?? r.priority,
    },
    {
      key: 'asset',
      header: 'الأصل / الموقع',
      render: (r) => {
        if (r.asset) {
          return (
            <Link href={`/maintenance/assets/${r.asset.id}`}>
              {r.asset.label}
              <span className="muted" style={{ marginInlineStart: 6 }}>
                ({ASSET_KIND_LABELS[r.asset.kind] ?? r.asset.kind})
              </span>
            </Link>
          );
        }
        return r.locationText?.trim() || '—';
      },
    },
    {
      key: 'assignee',
      header: 'الفني',
      render: (r) => r.assignee?.name ?? '—',
    },
    {
      key: 'closedAt',
      header: 'تاريخ الإغلاق',
      render: (r) => formatDt(r.closedAt),
    },
    {
      key: 'notes',
      header: 'ملاحظات الإنجاز',
      render: (r) =>
        r.completionNotes?.trim()
          ? r.completionNotes.length > 80
            ? `${r.completionNotes.slice(0, 80)}…`
            : r.completionNotes
          : '—',
    },
  ];

  return (
    <TaskCard title="سجل الصيانة المكتملة">
      <form className="form form-wide" onSubmit={onFilter} style={{ marginBottom: '1rem' }}>
        <div className="form-grid-2">
          <label>
            الأصل (موقع / جهاز)
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
            >
              <option value="">الكل</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} — {ASSET_KIND_LABELS[a.kind] ?? a.kind}
                </option>
              ))}
            </select>
          </label>
          <label>
            نوع الأصل
            <select
              value={assetKind}
              onChange={(e) => setAssetKind(e.target.value)}
            >
              <option value="">الكل</option>
              {kinds.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            نوع العمل
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">الكل</option>
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            بحث
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="عنوان، موقع، اسم أصل…"
            />
          </label>
        </div>
        <div className="row-actions">
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'جاري البحث…' : 'تصفية'}
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={loading}
            onClick={() => {
              setAssetId('');
              setAssetKind('');
              setType('');
              setQ('');
              void load({});
            }}
          >
            مسح الفلاتر
          </button>
        </div>
      </form>

      {error ? <p className="error">{error}</p> : null}
      <DataTable
        columns={columns}
        rows={items}
        rowKey={(r) => r.id}
        emptyText="لا توجد عمليات صيانة مكتملة مطابقة"
      />
    </TaskCard>
  );
}
