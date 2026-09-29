'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import { listRoutes, setDefaultRoute } from '@/features/settings/network/api';
import type { RoutesInventory } from '@/features/settings/network/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  DataTable,
  IconButton,
  TaskCard,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';

export function RoutesCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.NETWORK_ROUTES_READ);
  const canManage = can(PERMISSIONS.NETWORK_ROUTES_MANAGE);
  const toast = useToast();

  const [data, setData] = useState<RoutesInventory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [gateway, setGateway] = useState('');
  const [device, setDevice] = useState('');

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      setData(await listRoutes());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب المسارات');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
  }, [canRead, reload]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy(true);
    try {
      await notifyMutation(
        toast,
        () => setDefaultRoute(gateway.trim(), device.trim() || undefined),
        { success: 'تم ضبط المسار الافتراضي' },
      );
      await reload();
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  if (!canRead) return null;

  const columns: Column<RoutesInventory['routes'][number]>[] = [
    {
      key: 'dst',
      header: 'الوجهة',
      render: (row) => (
        <span className="mono" dir="ltr">
          {row.destination}
        </span>
      ),
    },
    {
      key: 'gw',
      header: 'البوابة',
      render: (row) =>
        row.gateway ? (
          <span className="mono" dir="ltr">
            {row.gateway}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'dev',
      header: 'المنفذ',
      render: (row) =>
        row.device ? (
          <span className="mono" dir="ltr">
            {row.device}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'proto',
      header: 'البروتوكول',
      render: (row) => row.protocol || '—',
    },
    {
      key: 'metric',
      header: 'Metric',
      className: 'db-num',
      render: (row) => row.metric ?? '—',
    },
  ];

  return (
    <div className="task-stack">
      <TaskCard
        title="جدول التوجيه"
        actions={
          <IconButton
            label="تحديث"
            onClick={() => void reload()}
            disabled={busy}
          >
            ↻
          </IconButton>
        }
      >
        {error ? <p className="error">{error}</p> : null}
        {!data && !error ? <p className="muted">جاري القراءة…</p> : null}
        {data ? (
          <DataTable
            columns={columns}
            rows={data.routes}
            rowKey={(r) =>
              `${r.destination}|${r.gateway ?? ''}|${r.device ?? ''}|${r.metric ?? ''}`
            }
            emptyText="لا توجد مسارات"
          />
        ) : null}
      </TaskCard>

      {canManage ? (
        <TaskCard title="ضبط المسار الافتراضي">
          <form className="form net-route-form" onSubmit={submit}>
            <label>
              البوابة
              <input
                dir="ltr"
                value={gateway}
                onChange={(e) => setGateway(e.target.value)}
                placeholder="170.101.111.1"
                required
              />
            </label>
            <label>
              المنفذ (اختياري)
              <input
                dir="ltr"
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                placeholder="eno1"
              />
            </label>
            <button className="btn" type="submit" disabled={busy}>
              تطبيق
            </button>
          </form>
        </TaskCard>
      ) : null}
    </div>
  );
}
