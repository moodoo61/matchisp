'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { PERMISSIONS } from '@isp/shared';
import {
  closeWorkOrder,
  listPendingReview,
  reworkWorkOrder,
} from '@/features/maintenance/api';
import type { WorkOrder } from '@/features/maintenance/types';
import { WorkOrderAttachments } from '@/features/maintenance/components/WorkOrderAttachments';
import {
  PARTS_STATUS_LABELS,
  PRIORITY_LABELS,
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

export function ReviewQueueCard() {
  const toast = useToast();
  const { can } = usePermissions();
  const canSupervise = can(PERMISSIONS.MAINTENANCE_SUPERVISE);

  const [items, setItems] = useState<WorkOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<WorkOrder | null>(null);
  const [closeNotes, setCloseNotes] = useState('');
  const [reworkOpen, setReworkOpen] = useState(false);
  const [reworkReason, setReworkReason] = useState('');
  const [approveOpen, setApproveOpen] = useState(false);

  async function reload() {
    try {
      setItems(await listPendingReview());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    if (canSupervise) void reload();
  }, [canSupervise]);

  if (!canSupervise) {
    return (
      <TaskCard title="المراجعة">
        <p className="muted">
          تحتاج صلاحية المشرف (<code>maintenance:supervise</code>).
        </p>
      </TaskCard>
    );
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
      key: 'assignee',
      header: 'الفني',
      render: (r) => r.assignee?.name ?? '—',
    },
    {
      key: 'finished',
      header: 'أنجز في',
      render: (r) => formatDt(r.fieldFinishedAt),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button
          type="button"
          className="btn"
          onClick={() => {
            setSelected(r);
            setCloseNotes('');
            setReworkReason('');
          }}
        >
          مراجعة
        </button>
      ),
    },
  ];

  return (
    <>
      <TaskCard title={`بانتظار المراجعة (${items.length})`}>
        {error ? <p className="error">{error}</p> : null}
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          emptyText="لا توجد أوامر بانتظار الاعتماد — ممتاز"
        />
      </TaskCard>

      <Modal
        open={Boolean(selected)}
        title={
          selected
            ? `مراجعة أمر #${selected.number}`
            : 'مراجعة'
        }
        onClose={() => setSelected(null)}
        panelClassName="modal-panel-wide"
        footer={
          selected ? (
            <>
              <Link
                href={`/maintenance/work-orders/${selected.id}`}
                className="btn secondary"
              >
                فتح الصفحة الكاملة
              </Link>
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  setReworkReason('');
                  setReworkOpen(true);
                }}
              >
                إعادة تنفيذ
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setCloseNotes('');
                  setApproveOpen(true);
                }}
              >
                اعتماد وإغلاق
              </button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="form form-wide" style={{ gap: '1rem' }}>
            <div>
              <strong>{selected.title}</strong>
              <p className="muted" style={{ margin: '0.25rem 0 0' }}>
                {WO_TYPE_LABELS[selected.type] ?? selected.type} ·{' '}
                {PRIORITY_LABELS[selected.priority] ?? selected.priority} ·{' '}
                الفني: {selected.assignee?.name ?? '—'}
              </p>
            </div>

            <section>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem' }}>
                تقرير الإنجاز الفني
              </h3>
              <p
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  background: 'var(--bg)',
                }}
              >
                {selected.completionNotes || '—'}
              </p>
            </section>

            {selected.rootCause ? (
              <section>
                <h3 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem' }}>
                  السبب الجذري
                </h3>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {selected.rootCause}
                </p>
              </section>
            ) : null}

            <section>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem' }}>
                السياق
              </h3>
              <ul style={{ margin: 0, paddingInlineStart: '1.1rem' }}>
                <li>الموقع: {selected.locationText || '—'}</li>
                <li>الأصل: {selected.asset?.label ?? '—'}</li>
                <li>
                  البلاغ:{' '}
                  {selected.request
                    ? `#${selected.request.number}`
                    : '—'}
                </li>
                <li>أنجز في: {formatDt(selected.fieldFinishedAt)}</li>
              </ul>
            </section>

            {selected.partsRequests?.length ? (
              <section>
                <h3 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem' }}>
                  طلبات القطع
                </h3>
                <ul style={{ margin: 0, paddingInlineStart: '1.1rem' }}>
                  {selected.partsRequests.map((p) => (
                    <li key={p.id}>
                      {p.description} ×{p.quantity} —{' '}
                      {PARTS_STATUS_LABELS[p.status] ?? p.status}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <WorkOrderAttachments
              workOrderId={selected.id}
              attachments={selected.attachments ?? []}
              canUpload
              onUploaded={async () => {
                const rows = await listPendingReview();
                setItems(rows);
                const fresh = rows.find((r) => r.id === selected.id);
                if (fresh) setSelected(fresh);
              }}
            />
          </div>
        ) : null}
      </Modal>

      <Modal
        open={approveOpen && Boolean(selected)}
        title="اعتماد وإغلاق"
        onClose={() => setApproveOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setApproveOpen(false)}
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="approve-close-form"
              className="btn"
            >
              تأكيد الإغلاق
            </button>
          </>
        }
      >
        <form
          id="approve-close-form"
          className="form form-wide"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (!selected) return;
            void (async () => {
              try {
                await notifyMutation(
                  toast,
                  () =>
                    closeWorkOrder(
                      selected.id,
                      closeNotes.trim() || undefined,
                    ),
                  { success: 'تم اعتماد الأمر وإغلاقه' },
                );
                setApproveOpen(false);
                setSelected(null);
                await reload();
              } catch {
                /* toast */
              }
            })();
          }}
        >
          <label>
            ملاحظات الاعتماد (اختياري)
            <textarea
              rows={3}
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder="مثال: تم التحقق من التقرير والاستعادة…"
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={reworkOpen && Boolean(selected)}
        title="إعادة تنفيذ"
        onClose={() => setReworkOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setReworkOpen(false)}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="btn danger"
              disabled={reworkReason.trim().length < 2}
              onClick={() => {
                if (!selected) return;
                void (async () => {
                  try {
                    await notifyMutation(
                      toast,
                      () =>
                        reworkWorkOrder(
                          selected.id,
                          reworkReason.trim(),
                        ),
                      { success: 'أُعيد للتنفيذ' },
                    );
                    setReworkOpen(false);
                    setSelected(null);
                    await reload();
                  } catch {
                    /* toast */
                  }
                })();
              }}
            >
              تأكيد الإعادة
            </button>
          </>
        }
      >
        <label className="form form-wide">
          سبب رفض الاعتماد (يراه الفني)
          <textarea
            rows={3}
            value={reworkReason}
            onChange={(e) => setReworkReason(e.target.value)}
            placeholder="ما الذي يجب إصلاحه أو استكماله؟"
            required
          />
        </label>
      </Modal>
    </>
  );
}
