'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PERMISSIONS } from '@isp/shared';
import {
  listDeviceStatuses,
  listDevices,
  listItems,
  markDeviceFaulty,
  type MetaOption,
} from '@/features/inventory/api';
import type { DeviceUnit, InventoryItem } from '@/features/inventory/types';
import {
  DEVICE_STATUS_LABELS,
  formatDt,
} from '@/features/inventory/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  DataTable,
  TaskCard,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';

export function DevicesCard() {
  const toast = useToast();
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.INVENTORY_READ);
  const canAct = can(PERMISSIONS.INVENTORY_ISSUE) || can(PERMISSIONS.INVENTORY_MANAGE);
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') ?? '';

  const [items, setItems] = useState<DeviceUnit[]>([]);
  const [catalog, setCatalog] = useState<InventoryItem[]>([]);
  const [statuses, setStatuses] = useState<MetaOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [itemId, setItemId] = useState('');
  const [q, setQ] = useState('');

  async function load(filters?: {
    status?: string;
    itemId?: string;
    q?: string;
  }) {
    try {
      const rows = await listDevices(filters);
      setItems(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    if (!canRead) return;
    void (async () => {
      try {
        const [c, st] = await Promise.all([
          listItems(),
          listDeviceStatuses(),
        ]);
        setCatalog(c.filter((i) => i.kind === 'serialized'));
        setStatuses(st);
      } catch {
        /* ignore */
      }
      await load({ status: initialStatus || undefined });
    })();
  }, [canRead, initialStatus]);

  if (!canRead) return null;

  function onFilter(e: FormEvent) {
    e.preventDefault();
    void load({
      status: status || undefined,
      itemId: itemId || undefined,
      q: q || undefined,
    });
  }

  const columns: Column<DeviceUnit>[] = [
    { key: 'serial', header: 'التسلسلي', render: (r) => r.serial },
    {
      key: 'item',
      header: 'الصنف',
      render: (r) => `${r.item.code} — ${r.item.name}`,
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (r) => DEVICE_STATUS_LABELS[r.status] ?? r.status,
    },
    {
      key: 'holder',
      header: 'لدى',
      render: (r) => r.holder?.name ?? (r.status === 'in_stock' ? 'المخزن' : '—'),
    },
    {
      key: 'wo',
      header: 'أمر عمل',
      render: (r) =>
        r.workOrderId ? (
          <Link href={`/maintenance/work-orders/${r.workOrderId}`}>
            فتح
          </Link>
        ) : (
          '—'
        ),
    },
    {
      key: 'updated',
      header: 'آخر تحديث',
      render: (r) => formatDt(r.updatedAt),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => {
        if (!canAct || r.status === 'scrapped' || r.status === 'faulty') {
          return null;
        }
        return (
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              void (async () => {
                try {
                  await notifyMutation(
                    toast,
                    () => markDeviceFaulty(r.id),
                    { success: 'تم تعليم الجهاز تالفاً' },
                  );
                  await load({
                    status: status || undefined,
                    itemId: itemId || undefined,
                    q: q || undefined,
                  });
                } catch {
                  /* toast */
                }
              })();
            }}
          >
            تالف
          </button>
        );
      },
    },
  ];

  return (
    <TaskCard title="الأجهزة المتسلسلة">
      <form
        className="form form-wide"
        onSubmit={onFilter}
        style={{ marginBottom: '1rem' }}
      >
        <div className="form-grid-2">
          <label>
            الحالة
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">الكل</option>
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            الصنف
            <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
              <option value="">الكل</option>
              {catalog.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.code} — {i.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            بحث
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="رقم تسلسلي أو صنف"
            />
          </label>
        </div>
        <button type="submit" className="btn">
          تصفية
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      <DataTable
        columns={columns}
        rows={items}
        rowKey={(r) => r.id}
        emptyText="لا توجد أجهزة مطابقة"
      />
    </TaskCard>
  );
}
