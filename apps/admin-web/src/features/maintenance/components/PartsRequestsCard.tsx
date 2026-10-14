'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PERMISSIONS } from '@isp/shared';
import {
  listOpenPartsRequests,
  updatePartsRequest,
  type PartsRequest,
} from '@/features/maintenance/api';
import { PARTS_STATUS_LABELS } from '@/features/maintenance/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  DataTable,
  Modal,
  TaskCard,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';

export function PartsRequestsCard() {
  const toast = useToast();
  const { can } = usePermissions();
  const canParts = can(PERMISSIONS.MAINTENANCE_PARTS);
  const [items, setItems] = useState<PartsRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  async function reload() {
    try {
      setItems(await listOpenPartsRequests());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    if (canParts) void reload();
  }, [canParts]);

  if (!canParts) return null;

  const columns: Column<PartsRequest>[] = [
    {
      key: 'wo',
      header: 'أمر العمل',
      render: (r) =>
        r.workOrder ? (
          <Link href={`/maintenance/work-orders/${r.workOrder.id}`}>
            #{r.workOrder.number} — {r.workOrder.title}
          </Link>
        ) : (
          '—'
        ),
    },
    { key: 'desc', header: 'الوصف', render: (r) => r.description },
    { key: 'qty', header: 'الكمية', render: (r) => r.quantity },
    {
      key: 'status',
      header: 'الحالة',
      render: (r) => PARTS_STATUS_LABELS[r.status] ?? r.status,
    },
    {
      key: 'by',
      header: 'الطالب',
      render: (r) => r.requestedBy?.name ?? '—',
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="row-actions">
          {r.status === 'open' ? (
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                void (async () => {
                  try {
                    await notifyMutation(
                      toast,
                      () =>
                        updatePartsRequest(r.id, { status: 'acknowledged' }),
                      { success: 'تم الاستلام' },
                    );
                    await reload();
                  } catch {
                    /* toast */
                  }
                })();
              }}
            >
              استلام
            </button>
          ) : null}
          {r.status === 'open' || r.status === 'acknowledged' ? (
            <>
              {r.workOrder ? (
                <Link
                  className="btn"
                  href={`/inventory/documents?type=issue&workOrderId=${r.workOrder.id}&partsRequestId=${r.id}`}
                >
                  صرف من المخزن
                </Link>
              ) : null}
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  void (async () => {
                    try {
                      await notifyMutation(
                        toast,
                        () =>
                          updatePartsRequest(r.id, {
                            status: 'fulfilled',
                            resumeWorkOrder: true,
                          }),
                        { success: 'تم تعليم الطلب مصروفاً' },
                      );
                      await reload();
                    } catch {
                      /* toast */
                    }
                  })();
                }}
              >
                تم الصرف
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  setRejectId(r.id);
                  setRejectReason('');
                }}
              >
                رفض
              </button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <TaskCard title="طلبات القطع">
        {error ? <p className="error">{error}</p> : null}
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          emptyText="لا توجد طلبات مفتوحة"
        />
      </TaskCard>
      <Modal
        open={Boolean(rejectId)}
        title="رفض طلب القطع"
        onClose={() => setRejectId(null)}
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setRejectId(null)}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="btn danger"
              disabled={rejectReason.trim().length < 2}
              onClick={() => {
                if (!rejectId) return;
                void (async () => {
                  try {
                    await notifyMutation(
                      toast,
                      () =>
                        updatePartsRequest(rejectId, {
                          status: 'rejected',
                          rejectReason: rejectReason.trim(),
                        }),
                      { success: 'تم رفض الطلب' },
                    );
                    setRejectId(null);
                    await reload();
                  } catch {
                    /* toast */
                  }
                })();
              }}
            >
              تأكيد
            </button>
          </>
        }
      >
        <label className="form form-wide">
          السبب
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </label>
      </Modal>
    </>
  );
}
