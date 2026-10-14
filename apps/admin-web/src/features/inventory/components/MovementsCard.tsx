'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import { listMovements } from '@/features/inventory/api';
import type { StockMovement } from '@/features/inventory/types';
import {
  DOC_TYPE_LABELS,
  formatDt,
} from '@/features/inventory/types';
import { usePermissions } from '@/lib/usePermissions';
import { DataTable, TaskCard, type Column } from '@/shared/ui';

export function MovementsCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.INVENTORY_READ);
  const [items, setItems] = useState<StockMovement[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canRead) return;
    void (async () => {
      try {
        setItems(await listMovements());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطأ');
      }
    })();
  }, [canRead]);

  if (!canRead) return null;

  const columns: Column<StockMovement>[] = [
    {
      key: 'when',
      header: 'التاريخ',
      render: (r) => formatDt(r.createdAt),
    },
    {
      key: 'type',
      header: 'النوع',
      render: (r) => DOC_TYPE_LABELS[r.type] ?? r.type,
    },
    {
      key: 'item',
      header: 'الصنف',
      render: (r) => `${r.item.code} — ${r.item.name}`,
    },
    {
      key: 'serial',
      header: 'تسلسلي',
      render: (r) => r.deviceUnit?.serial ?? '—',
    },
    {
      key: 'delta',
      header: 'الحركة',
      render: (r) => (r.delta > 0 ? `+${r.delta}` : String(r.delta)),
    },
    {
      key: 'bal',
      header: 'الرصيد بعد',
      render: (r) => r.balanceAfter,
    },
    {
      key: 'doc',
      header: 'مستند',
      render: (r) => (r.document ? `#${r.document.number}` : '—'),
    },
    {
      key: 'actor',
      header: 'بواسطة',
      render: (r) => r.actor?.name ?? '—',
    },
  ];

  return (
    <TaskCard title="سجل الحركات">
      {error ? <p className="error">{error}</p> : null}
      <DataTable
        columns={columns}
        rows={items}
        rowKey={(r) => r.id}
        emptyText="لا حركات داخل"
      />
    </TaskCard>
  );
}
