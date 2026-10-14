'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PERMISSIONS } from '@isp/shared';
import {
  cancelDocument,
  createDocument,
  listDevices,
  listDocuments,
  listInventoryMembers,
  listItems,
  postDocument,
} from '@/features/inventory/api';
import type {
  DeviceUnit,
  InventoryItem,
  StockDocument,
  UserBrief,
} from '@/features/inventory/types';
import {
  DOC_STATUS_LABELS,
  DOC_TYPE_LABELS,
  ITEM_KIND_LABELS,
  formatDt,
} from '@/features/inventory/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  DataTable,
  Modal,
  TaskCard,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';

type LineDraft = {
  itemId: string;
  quantity: number;
  serial: string;
  deviceUnitId: string;
  adjustDelta: number;
};

export function DocumentsCard() {
  const toast = useToast();
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.INVENTORY_READ);
  const canWrite =
    can(PERMISSIONS.INVENTORY_MANAGE) ||
    can(PERMISSIONS.INVENTORY_RECEIVE) ||
    can(PERMISSIONS.INVENTORY_ISSUE);

  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') ?? '';
  const initialWorkOrderId = searchParams.get('workOrderId') ?? '';
  const initialPartsRequestId = searchParams.get('partsRequestId') ?? '';

  const [docs, setDocs] = useState<StockDocument[]>([]);
  const [catalog, setCatalog] = useState<InventoryItem[]>([]);
  const [members, setMembers] = useState<UserBrief[]>([]);
  const [stockDevices, setStockDevices] = useState<DeviceUnit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState(initialType);

  const [open, setOpen] = useState(Boolean(initialType));
  const [docType, setDocType] = useState(initialType || 'receipt');
  const [note, setNote] = useState('');
  const [issuedToUserId, setIssuedToUserId] = useState('');
  const [workOrderId, setWorkOrderId] = useState(initialWorkOrderId);
  const [partsRequestId, setPartsRequestId] = useState(initialPartsRequestId);
  const [lines, setLines] = useState<LineDraft[]>([
    { itemId: '', quantity: 1, serial: '', deviceUnitId: '', adjustDelta: 1 },
  ]);

  async function reload(type?: string) {
    try {
      setDocs(await listDocuments(type || undefined));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    if (!canRead) return;
    void (async () => {
      try {
        const [items, mem, inStock, issued] = await Promise.all([
          listItems(),
          listInventoryMembers(),
          listDevices({ status: 'in_stock' }),
          listDevices({ status: 'issued' }),
        ]);
        setCatalog(items.filter((i) => i.active));
        setMembers(mem);
        setStockDevices([...inStock, ...issued]);
      } catch {
        /* ignore */
      }
      await reload(initialType || undefined);
    })();
  }, [canRead, initialType]);

  const selectedItem = useMemo(() => {
    return (id: string) => catalog.find((c) => c.id === id);
  }, [catalog]);

  if (!canRead) return null;

  const columns: Column<StockDocument>[] = [
    { key: 'number', header: 'الرقم', render: (r) => `#${r.number}` },
    {
      key: 'type',
      header: 'النوع',
      render: (r) => DOC_TYPE_LABELS[r.type] ?? r.type,
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (r) => DOC_STATUS_LABELS[r.status] ?? r.status,
    },
    {
      key: 'to',
      header: 'المستلم',
      render: (r) => r.issuedTo?.name ?? '—',
    },
    {
      key: 'wo',
      header: 'أمر عمل',
      render: (r) =>
        r.workOrderId ? (
          <Link href={`/maintenance/work-orders/${r.workOrderId}`}>ربط</Link>
        ) : (
          '—'
        ),
    },
    {
      key: 'lines',
      header: 'بنود',
      render: (r) => r.lines?.length ?? 0,
    },
    {
      key: 'when',
      header: 'التاريخ',
      render: (r) => formatDt(r.postedAt ?? r.createdAt),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => {
        if (!canWrite || r.status !== 'draft') return null;
        return (
          <div className="row-actions">
            <button
              type="button"
              className="btn"
              onClick={() => {
                void (async () => {
                  try {
                    await notifyMutation(toast, () => postDocument(r.id), {
                      success: 'تم اعتماد المستند وتحديث الرصيد',
                    });
                    await reload(filterType || undefined);
                    setStockDevices(await listDevices({ status: 'in_stock' }));
                  } catch {
                    /* toast */
                  }
                })();
              }}
            >
              اعتماد
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                void (async () => {
                  try {
                    await notifyMutation(toast, () => cancelDocument(r.id), {
                      success: 'تم إلغاء المسودة',
                    });
                    await reload(filterType || undefined);
                  } catch {
                    /* toast */
                  }
                })();
              }}
            >
              إلغاء
            </button>
          </div>
        );
      },
    },
  ];

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await notifyMutation(
        toast,
        () =>
          createDocument({
            type: docType,
            note: note.trim() || undefined,
            issuedToUserId: issuedToUserId || undefined,
            workOrderId: workOrderId.trim() || undefined,
            partsRequestId: partsRequestId.trim() || undefined,
            lines: lines
              .filter((l) => l.itemId)
              .map((l) => {
                const item = selectedItem(l.itemId);
                if (docType === 'adjustment') {
                  return { itemId: l.itemId, adjustDelta: l.adjustDelta };
                }
                if (item?.kind === 'serialized') {
                  if (docType === 'receipt') {
                    return {
                      itemId: l.itemId,
                      quantity: 1,
                      serial: l.serial.trim(),
                    };
                  }
                  return {
                    itemId: l.itemId,
                    quantity: 1,
                    deviceUnitId: l.deviceUnitId,
                  };
                }
                return { itemId: l.itemId, quantity: l.quantity };
              }),
          }),
        { success: 'تم إنشاء المسودة — اعتمدها لتحديث الرصيد' },
      );
      setOpen(false);
      setNote('');
      setLines([
        {
          itemId: '',
          quantity: 1,
          serial: '',
          deviceUnitId: '',
          adjustDelta: 1,
        },
      ]);
      await reload(filterType || undefined);
    } catch {
      /* toast */
    }
  }

  return (
    <>
      <TaskCard
        title="أوامر التوريد والصرف"
        actions={
          <div className="row-actions">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                void reload(e.target.value || undefined);
              }}
            >
              <option value="">كل الأنواع</option>
              <option value="receipt">توريد</option>
              <option value="issue">صرف</option>
              <option value="return">إرجاع</option>
              <option value="adjustment">تعديل</option>
            </select>
            {canWrite ? (
              <button
                type="button"
                className="btn"
                onClick={() => setOpen(true)}
              >
                مستند جديد
              </button>
            ) : null}
          </div>
        }
      >
        {error ? <p className="error">{error}</p> : null}
        <DataTable
          columns={columns}
          rows={docs}
          rowKey={(r) => r.id}
          emptyText="لا مستندات"
        />
      </TaskCard>

      <Modal
        open={open}
        title="مستند مخزني جديد"
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
            <button type="submit" form="create-doc-form" className="btn">
              حفظ مسودة
            </button>
          </>
        }
      >
        <form
          id="create-doc-form"
          className="form form-wide"
          onSubmit={onCreate}
        >
          <div className="form-grid-2">
            <label>
              النوع
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <option value="receipt">توريد</option>
                <option value="issue">صرف</option>
                <option value="return">إرجاع</option>
                <option value="adjustment">تعديل</option>
              </select>
            </label>
            {docType === 'issue' ? (
              <label>
                المستلم (فني)
                <select
                  value={issuedToUserId}
                  onChange={(e) => setIssuedToUserId(e.target.value)}
                >
                  <option value="">—</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                ملاحظة
                <input value={note} onChange={(e) => setNote(e.target.value)} />
              </label>
            )}
          </div>
          {docType === 'issue' ? (
            <div className="form-grid-2">
              <label>
                أمر عمل (اختياري)
                <input
                  value={workOrderId}
                  onChange={(e) => setWorkOrderId(e.target.value)}
                  placeholder="UUID أمر العمل"
                />
              </label>
              <label>
                طلب قطع (اختياري)
                <input
                  value={partsRequestId}
                  onChange={(e) => setPartsRequestId(e.target.value)}
                  placeholder="UUID طلب القطع"
                />
              </label>
            </div>
          ) : null}
          {docType === 'issue' || docType === 'adjustment' ? (
            <label>
              ملاحظة / سبب
              <input value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
          ) : null}

          <p className="muted" style={{ margin: '0.5rem 0' }}>
            البنود
          </p>
          {lines.map((line, idx) => {
            const item = selectedItem(line.itemId);
            return (
              <div
                key={idx}
                className="form-grid-2"
                style={{
                  marginBottom: '0.75rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <label>
                  الصنف
                  <select
                    value={line.itemId}
                    onChange={(e) => {
                      const next = [...lines];
                      next[idx] = { ...line, itemId: e.target.value };
                      setLines(next);
                    }}
                    required
                  >
                    <option value="">—</option>
                    {catalog.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name} (
                        {ITEM_KIND_LABELS[c.kind] ?? c.kind})
                      </option>
                    ))}
                  </select>
                </label>
                {docType === 'adjustment' ? (
                  <label>
                    الفرق (+/−)
                    <input
                      type="number"
                      value={line.adjustDelta}
                      onChange={(e) => {
                        const next = [...lines];
                        next[idx] = {
                          ...line,
                          adjustDelta: Number(e.target.value) || 0,
                        };
                        setLines(next);
                      }}
                      required
                    />
                  </label>
                ) : item?.kind === 'serialized' && docType === 'receipt' ? (
                  <label>
                    الرقم التسلسلي
                    <input
                      value={line.serial}
                      onChange={(e) => {
                        const next = [...lines];
                        next[idx] = { ...line, serial: e.target.value };
                        setLines(next);
                      }}
                      required
                    />
                  </label>
                ) : item?.kind === 'serialized' ? (
                  <label>
                    الجهاز
                    <select
                      value={line.deviceUnitId}
                      onChange={(e) => {
                        const next = [...lines];
                        next[idx] = {
                          ...line,
                          deviceUnitId: e.target.value,
                        };
                        setLines(next);
                      }}
                      required
                    >
                      <option value="">—</option>
                      {stockDevices
                        .filter((d) => {
                          if (d.itemId !== line.itemId) return false;
                          if (docType === 'issue') return d.status === 'in_stock';
                          if (docType === 'return') return d.status === 'issued';
                          return true;
                        })
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.serial}
                          </option>
                        ))}
                    </select>
                  </label>
                ) : (
                  <label>
                    الكمية
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => {
                        const next = [...lines];
                        next[idx] = {
                          ...line,
                          quantity: Number(e.target.value) || 1,
                        };
                        setLines(next);
                      }}
                      required
                    />
                  </label>
                )}
              </div>
            );
          })}
          <button
            type="button"
            className="btn secondary"
            onClick={() =>
              setLines((prev) => [
                ...prev,
                {
                  itemId: '',
                  quantity: 1,
                  serial: '',
                  deviceUnitId: '',
                  adjustDelta: 1,
                },
              ])
            }
          >
            بند إضافي
          </button>
        </form>
      </Modal>
    </>
  );
}
