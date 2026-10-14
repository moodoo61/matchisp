'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { PERMISSIONS } from '@isp/shared';
import {
  createAsset,
  listAssetKinds,
  listAssets,
  type MetaOption,
} from '@/features/maintenance/api';
import type { Asset } from '@/features/maintenance/types';
import { ASSET_KIND_LABELS } from '@/features/maintenance/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  DataTable,
  Modal,
  TaskCard,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';

export function AssetsCard() {
  const toast = useToast();
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.MAINTENANCE_READ);
  const canCreate = can(PERMISSIONS.MAINTENANCE_TRIAGE);

  const [items, setItems] = useState<Asset[]>([]);
  const [kinds, setKinds] = useState<MetaOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState('subscriber');
  const [label, setLabel] = useState('');
  const [externalRef, setExternalRef] = useState('');

  async function reload() {
    try {
      const [rows, k] = await Promise.all([listAssets(), listAssetKinds()]);
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

  const columns: Column<Asset>[] = [
    {
      key: 'label',
      header: 'الاسم',
      render: (r) => (
        <Link href={`/maintenance/assets/${r.id}`}>{r.label}</Link>
      ),
    },
    {
      key: 'kind',
      header: 'النوع',
      render: (r) => ASSET_KIND_LABELS[r.kind] ?? r.kind,
    },
    {
      key: 'ref',
      header: 'مرجع',
      render: (r) => r.externalRef || '—',
    },
    {
      key: 'wos',
      header: 'أوامر',
      render: (r) => r.workOrdersCount ?? 0,
    },
    {
      key: 'reqs',
      header: 'بلاغات',
      render: (r) => r.requestsCount ?? 0,
    },
  ];

  return (
    <>
      <TaskCard
        title="الأصول"
        actions={
          canCreate ? (
            <button type="button" className="btn" onClick={() => setOpen(true)}>
              أصل جديد
            </button>
          ) : null
        }
      >
        {error ? <p className="error">{error}</p> : null}
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          emptyText="لا توجد أصول"
        />
      </TaskCard>

      <Modal
        open={open}
        title="أصل جديد"
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
            <button type="submit" form="asset-create-form" className="btn">
              حفظ
            </button>
          </>
        }
      >
        <form
          id="asset-create-form"
          className="form form-wide"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void (async () => {
              try {
                await notifyMutation(
                  toast,
                  () =>
                    createAsset({
                      kind,
                      label: label.trim(),
                      externalRef: externalRef.trim() || undefined,
                    }),
                  { success: 'تم إنشاء الأصل' },
                );
                setOpen(false);
                setLabel('');
                setExternalRef('');
                await reload();
              } catch {
                /* toast */
              }
            })();
          }}
        >
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
          <label>
            الاسم
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              minLength={2}
            />
          </label>
          <label>
            مرجع خارجي
            <input
              value={externalRef}
              onChange={(e) => setExternalRef(e.target.value)}
            />
          </label>
        </form>
      </Modal>
    </>
  );
}
