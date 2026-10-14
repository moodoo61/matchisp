'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  createItem,
  listItemKinds,
  listItems,
  type MetaOption,
} from '@/features/inventory/api';
import type { InventoryItem } from '@/features/inventory/types';
import { ITEM_KIND_LABELS } from '@/features/inventory/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  DataTable,
  Modal,
  TaskCard,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';

export function ItemsCard() {
  const toast = useToast();
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.INVENTORY_READ);
  const canManage = can(PERMISSIONS.INVENTORY_MANAGE);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [kinds, setKinds] = useState<MetaOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [kind, setKind] = useState('serialized');
  const [unit, setUnit] = useState('قطعة');
  const [minQty, setMinQty] = useState(0);

  async function reload() {
    try {
      const [rows, k] = await Promise.all([listItems(), listItemKinds()]);
      setItems(rows);
      setKinds(k);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    if (canRead) void reload();
  }, [canRead]);

  if (!canRead) return null;

  const columns: Column<InventoryItem>[] = [
    { key: 'code', header: 'الرمز', render: (r) => r.code },
    { key: 'name', header: 'الاسم', render: (r) => r.name },
    {
      key: 'kind',
      header: 'النوع',
      render: (r) => ITEM_KIND_LABELS[r.kind] ?? r.kind,
    },
    { key: 'qty', header: 'الرصيد', render: (r) => r.quantity },
    { key: 'unit', header: 'الوحدة', render: (r) => r.unit },
    { key: 'min', header: 'حد أدنى', render: (r) => r.minQty },
    {
      key: 'devices',
      header: 'أجهزة',
      render: (r) => (r.kind === 'serialized' ? r.devicesCount : '—'),
    },
    {
      key: 'active',
      header: 'الحالة',
      render: (r) => (r.active ? 'نشط' : 'موقوف'),
    },
  ];

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await notifyMutation(
        toast,
        () =>
          createItem({
            code: code.trim(),
            name: name.trim(),
            kind,
            unit: unit.trim(),
            minQty,
          }),
        { success: 'تم إنشاء الصنف' },
      );
      setOpen(false);
      setCode('');
      setName('');
      await reload();
    } catch {
      /* toast */
    }
  }

  return (
    <>
      <TaskCard
        title="الأصناف"
        actions={
          canManage ? (
            <button type="button" className="btn" onClick={() => setOpen(true)}>
              صنف جديد
            </button>
          ) : null
        }
      >
        {error ? <p className="error">{error}</p> : null}
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          emptyText="لا توجد أصناف"
        />
      </TaskCard>

      <Modal
        open={open}
        title="صنف جديد"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setOpen(false)}
            >
              إلغاء
            </button>
            <button type="submit" form="create-item-form" className="btn">
              حفظ
            </button>
          </>
        }
      >
        <form
          id="create-item-form"
          className="form form-wide"
          onSubmit={onCreate}
        >
          <div className="form-grid-2">
            <label>
              الرمز
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </label>
            <label>
              النوع
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                {kinds.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            الاسم
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </label>
          <div className="form-grid-2">
            <label>
              الوحدة
              <input value={unit} onChange={(e) => setUnit(e.target.value)} />
            </label>
            <label>
              حد أدنى
              <input
                type="number"
                min={0}
                value={minQty}
                onChange={(e) => setMinQty(Number(e.target.value) || 0)}
              />
            </label>
          </div>
        </form>
      </Modal>
    </>
  );
}
