'use client';

import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PERMISSIONS } from '@isp/shared';
import {
  createPartsRequest,
  finishFieldWorkOrder,
  listMyWorkOrders,
  rejectAssignment,
  resumeWorkOrder,
  startWorkOrder,
} from '@/features/maintenance/api';
import type { WorkOrder } from '@/features/maintenance/types';
import {
  PRIORITY_LABELS,
  WO_STATUS_LABELS,
  WO_TYPE_LABELS,
  formatDt,
} from '@/features/maintenance/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  DataTable,
  Modal,
  TaskCard,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';

export function MyWorkCard() {
  const toast = useToast();
  const router = useRouter();
  const { can } = usePermissions();
  const canExecute = can(PERMISSIONS.MAINTENANCE_EXECUTE);
  const canSupervise = can(PERMISSIONS.MAINTENANCE_SUPERVISE);
  const canRead = can(PERMISSIONS.MAINTENANCE_READ);

  const [items, setItems] = useState<WorkOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [finishId, setFinishId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [partsId, setPartsId] = useState<string | null>(null);
  const [partsDesc, setPartsDesc] = useState('');
  const [partsQty, setPartsQty] = useState(1);

  async function reload() {
    try {
      setItems(await listMyWorkOrders());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    if (canExecute) void reload();
  }, [canExecute]);

  if (!canExecute) {
    return (
      <TaskCard title="أوامري">
        <p className="muted">
          لا تملك صلاحية التنفيذ (
          <code>maintenance:execute</code>). إن كنتَ مديراً بعد تحديث
          النظام، سجّل الخروج ثم الدخول مجدداً لتحديث الصلاحيات.
        </p>
        {canRead || canSupervise ? (
          <p style={{ marginTop: '0.75rem' }}>
            <Link href="/maintenance/work-orders" className="btn secondary">
              عرض كل أوامر العمل
            </Link>
          </p>
        ) : null}
      </TaskCard>
    );
  }

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await notifyMutation(toast, action, { success });
      await reload();
    } catch {
      /* toast */
    }
  }

  function actionsFor(row: WorkOrder) {
    const buttons: ReactNode[] = [];

    buttons.push(
      <button
        key="open"
        type="button"
        className="btn secondary"
        onClick={() => router.push(`/maintenance/work-orders/${row.id}`)}
      >
        فتح
      </button>,
    );

    if (row.status === 'assigned') {
      buttons.push(
        <button
          key="start"
          type="button"
          className="btn"
          onClick={() =>
            void run(() => startWorkOrder(row.id), 'بدأ التنفيذ')
          }
        >
          تنفيذ
        </button>,
        <button
          key="reject"
          type="button"
          className="btn danger"
          onClick={() => {
            setRejectId(row.id);
            setRejectReason('');
          }}
        >
          رفض
        </button>,
      );
    }

    if (row.status === 'accepted' || row.status === 'rework') {
      buttons.push(
        <button
          key="start"
          type="button"
          className="btn"
          onClick={() =>
            void run(() => startWorkOrder(row.id), 'بدأ التنفيذ')
          }
        >
          تنفيذ
        </button>,
      );
    }

    if (row.status === 'in_progress') {
      buttons.push(
        <button
          key="parts"
          type="button"
          className="btn secondary"
          onClick={() => {
            setPartsId(row.id);
            setPartsDesc('');
            setPartsQty(1);
          }}
        >
          طلب قطع
        </button>,
        <button
          key="finish"
          type="button"
          className="btn"
          onClick={() => {
            setFinishId(row.id);
            setNotes('');
            setRootCause('');
          }}
        >
          إنجاز
        </button>,
      );
    }

    if (row.status === 'waiting_parts' || row.status === 'waiting_access') {
      buttons.push(
        <button
          key="resume"
          type="button"
          className="btn"
          onClick={() => void run(() => resumeWorkOrder(row.id), 'استئناف')}
        >
          استئناف
        </button>,
      );
    }

    if (row.status === 'done_field') {
      buttons.push(
        <span key="wait" className="muted" style={{ fontSize: '0.85rem' }}>
          بانتظار مراجعة المشرف
        </span>,
      );
    }

    return <div className="row-actions">{buttons}</div>;
  }

  const columns: Column<WorkOrder>[] = [
    { key: 'number', header: 'الرقم', render: (r) => r.number },
    { key: 'title', header: 'العنوان', render: (r) => r.title },
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
      key: 'status',
      header: 'الحالة',
      render: (r) => WO_STATUS_LABELS[r.status] ?? r.status,
    },
    {
      key: 'resolveBy',
      header: 'قبل',
      render: (r) => formatDt(r.resolveBy),
    },
    {
      key: 'actions',
      header: 'إجراءات',
      className: 'col-actions',
      render: (r) => actionsFor(r),
    },
  ];

  return (
    <>
      <TaskCard title="أوامري">
        {error ? <p className="error">{error}</p> : null}
        {!error && !items.length ? (
          <p className="muted">
            لا توجد أوامر معيَّنة لك بعد. من «أوامر العمل» عيّن الفني لنفسك
            حتى تظهر هنا أزرار التنفيذ.
          </p>
        ) : (
          <DataTable
            columns={columns}
            rows={items}
            rowKey={(r) => r.id}
            emptyText="لا توجد أوامر معيَّنة لك"
          />
        )}
      </TaskCard>

      <Modal
        open={Boolean(rejectId)}
        title="رفض التعيين"
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
                  await run(
                    () => rejectAssignment(rejectId, rejectReason.trim()),
                    'أُعيد للتوزيع',
                  );
                  setRejectId(null);
                })();
              }}
            >
              تأكيد
            </button>
          </>
        }
      >
        <textarea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="سبب الرفض…"
        />
      </Modal>

      <Modal
        open={Boolean(finishId)}
        title="إنجاز فني"
        onClose={() => setFinishId(null)}
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setFinishId(null)}
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="my-finish-form"
              className="btn"
              disabled={notes.trim().length < 2}
            >
              إرسال للمراجعة
            </button>
          </>
        }
      >
        <form
          id="my-finish-form"
          className="form form-wide"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (!finishId) return;
            void (async () => {
              await run(
                () =>
                  finishFieldWorkOrder(finishId, {
                    completionNotes: notes.trim(),
                    rootCause: rootCause.trim() || undefined,
                  }),
                'بانتظار المراجعة',
              );
              setFinishId(null);
            })();
          }}
        >
          <label>
            تقرير الإنجاز
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </label>
          <label>
            السبب الجذري (اختياري)
            <textarea
              rows={2}
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(partsId)}
        title="طلب قطع"
        onClose={() => setPartsId(null)}
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setPartsId(null)}
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="my-parts-form"
              className="btn"
              disabled={partsDesc.trim().length < 2}
            >
              إرسال
            </button>
          </>
        }
      >
        <form
          id="my-parts-form"
          className="form form-wide"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (!partsId) return;
            void (async () => {
              await run(
                () =>
                  createPartsRequest(partsId, {
                    description: partsDesc.trim(),
                    quantity: partsQty,
                    setWaiting: true,
                  }),
                'تم طلب القطع',
              );
              setPartsId(null);
            })();
          }}
        >
          <label>
            الوصف
            <textarea
              rows={3}
              value={partsDesc}
              onChange={(e) => setPartsDesc(e.target.value)}
              required
            />
          </label>
          <label>
            الكمية
            <input
              type="number"
              min={1}
              value={partsQty}
              onChange={(e) =>
                setPartsQty(Math.max(1, Number(e.target.value) || 1))
              }
            />
          </label>
        </form>
      </Modal>
    </>
  );
}
