'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAsset } from '@/features/maintenance/api';
import type { AssetDetail } from '@/features/maintenance/types';
import {
  ASSET_KIND_LABELS,
  PRIORITY_LABELS,
  REQUEST_STATUS_LABELS,
  WO_STATUS_LABELS,
  WO_TYPE_LABELS,
  formatDt,
} from '@/features/maintenance/types';

type Props = { id: string };

export function AssetDetailCard({ id }: Props) {
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setAsset(await getAsset(id));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطأ');
      }
    })();
  }, [id]);

  if (error) {
    return (
      <div>
        <p className="error">{error}</p>
        <Link href="/maintenance/assets" className="btn secondary">
          العودة
        </Link>
      </div>
    );
  }

  if (!asset) return <p className="muted">جاري التحميل…</p>;

  return (
    <div className="task-stack">
      <div className="row-actions">
        <Link href="/maintenance/assets" className="btn secondary">
          ← الأصول
        </Link>
        <Link
          href={`/maintenance/history?assetId=${asset.id}`}
          className="btn"
        >
          سجل الصيانة المكتملة
        </Link>
      </div>
      <article className="card" style={{ padding: '1.25rem' }}>
        <h2 style={{ margin: '0 0 0.35rem' }}>{asset.label}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {ASSET_KIND_LABELS[asset.kind] ?? asset.kind}
          {asset.externalRef ? ` · ${asset.externalRef}` : ''}
        </p>
        {asset.notes ? (
          <p style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap' }}>
            {asset.notes}
          </p>
        ) : null}

        <h3 style={{ margin: '1.25rem 0 0.5rem', fontSize: '1rem' }}>
          أوامر العمل ({asset.workOrders.length})
        </h3>
        {asset.workOrders.length ? (
          <ul style={{ margin: 0, paddingInlineStart: '1.1rem' }}>
            {asset.workOrders.map((w) => (
              <li key={w.id} style={{ marginBottom: '0.45rem' }}>
                <Link href={`/maintenance/work-orders/${w.id}`}>
                  #{w.number} — {w.title}
                </Link>
                <span className="muted">
                  {' '}
                  · {WO_TYPE_LABELS[w.type] ?? w.type} ·{' '}
                  {WO_STATUS_LABELS[w.status] ?? w.status} ·{' '}
                  {PRIORITY_LABELS[w.priority] ?? w.priority} ·{' '}
                  {w.assignee?.name ?? '—'} · {formatDt(w.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">لا أوامر على هذا الأصل</p>
        )}

        <h3 style={{ margin: '1.25rem 0 0.5rem', fontSize: '1rem' }}>
          البلاغات ({asset.requests.length})
        </h3>
        {asset.requests.length ? (
          <ul style={{ margin: 0, paddingInlineStart: '1.1rem' }}>
            {asset.requests.map((r) => (
              <li key={r.id} style={{ marginBottom: '0.35rem' }}>
                #{r.number} — {r.title}
                <span className="muted">
                  {' '}
                  · {REQUEST_STATUS_LABELS[r.status] ?? r.status} ·{' '}
                  {formatDt(r.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">لا بلاغات</p>
        )}
      </article>
    </div>
  );
}
