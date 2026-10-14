'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { PERMISSIONS } from '@isp/shared';
import {
  acceptWorkOrder,
  closeWorkOrder,
  createPartsRequest,
  finishFieldWorkOrder,
  getWorkOrder,
  rejectAssignment,
  resumeWorkOrder,
  reworkWorkOrder,
  startWorkOrder,
  waitPartsWorkOrder,
} from '@/features/maintenance/api';
import type { WorkOrder } from '@/features/maintenance/types';
import {
  PARTS_STATUS_LABELS,
  PRIORITY_LABELS,
  WO_STATUS_LABELS,
  WO_TYPE_LABELS,
  formatDt,
} from '@/features/maintenance/types';
import { usePermissions } from '@/lib/usePermissions';
import { WorkOrderAttachments } from '@/features/maintenance/components/WorkOrderAttachments';
import { Modal, notifyMutation, useToast } from '@/shared/ui';

type Props = { id: string };

export function WorkOrderDetailCard({ id }: Props) {
  const toast = useToast();
  const { can } = usePermissions();
  const canExecute = can(PERMISSIONS.MAINTENANCE_EXECUTE);
  const canSupervise = can(PERMISSIONS.MAINTENANCE_SUPERVISE);

  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [finishOpen, setFinishOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [reworkOpen, setReworkOpen] = useState(false);
  const [reworkReason, setReworkReason] = useState('');
  const [partsOpen, setPartsOpen] = useState(false);
  const [partsDesc, setPartsDesc] = useState('');
  const [partsQty, setPartsQty] = useState(1);
  const [closeOpen, setCloseOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  async function reload() {
    try {
      setWo(await getWorkOrder(id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    void reload();
  }, [id]);

  if (error) {
    return (
      <div>
        <p className="error">{error}</p>
        <Link href="/maintenance/work-orders" className="btn secondary">
          العودة
        </Link>
      </div>
    );
  }

  if (!wo) return <p className="muted">جاري التحميل…</p>;

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await notifyMutation(toast, action, { success });
      await reload();
    } catch {
      /* toast */
    }
  }

  return (
    <div className="task-stack">
      <div className="toolbar" style={{ padding: 0 }}>
        <Link href="/maintenance/work-orders" className="btn secondary">
          ← أوامر العمل
        </Link>
        <div className="row-actions">
          {canExecute && wo.status === 'assigned' ? (
            <>
              <button
                type="button"
                className="btn"
                onClick={() => void run(() => acceptWorkOrder(wo.id), 'تم القبول')}
              >
                قبول
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  setRejectReason('');
                  setRejectOpen(true);
                }}
              >
                رفض التعيين
              </button>
            </>
          ) : null}
          {canExecute &&
          (wo.status === 'accepted' || wo.status === 'rework') ? (
            <button
              type="button"
              className="btn"
              onClick={() => void run(() => startWorkOrder(wo.id), 'بدأ التنفيذ')}
            >
              بدء التنفيذ
            </button>
          ) : null}
          {canExecute && wo.status === 'in_progress' ? (
            <>
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setPartsDesc('');
                  setPartsQty(1);
                  setPartsOpen(true);
                }}
              >
                طلب قطع
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() =>
                  void run(() => waitPartsWorkOrder(wo.id), 'بانتظار مواد')
                }
              >
                انتظار مواد
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setNotes('');
                  setRootCause('');
                  setFinishOpen(true);
                }}
              >
                إنجاز فني
              </button>
            </>
          ) : null}
          {canExecute && wo.status === 'waiting_parts' ? (
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                setPartsDesc('');
                setPartsQty(1);
                setPartsOpen(true);
              }}
            >
              طلب قطع إضافي
            </button>
          ) : null}
          {canExecute &&
          (wo.status === 'waiting_parts' || wo.status === 'waiting_access') ? (
            <button
              type="button"
              className="btn"
              onClick={() => void run(() => resumeWorkOrder(wo.id), 'استئناف')}
            >
              استئناف
            </button>
          ) : null}
          {canSupervise && wo.status === 'done_field' ? (
            <>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setReviewNotes('');
                  setCloseOpen(true);
                }}
              >
                اعتماد وإغلاق
              </button>
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
            </>
          ) : null}
          {canExecute &&
          !canSupervise &&
          wo.status === 'done_field' ? (
            <span className="muted">بانتظار مراجعة المشرف</span>
          ) : null}
          {wo.status === 'approved' || wo.status === 'draft' ? (
            <span className="muted">بانتظار التعيين من الموزّع</span>
          ) : null}
          {wo.status === 'closed' || wo.status === 'cancelled' ? (
            <span className="muted">الأمر مغلق — لا إجراءات</span>
          ) : null}
        </div>
      </div>

      <article className="card" style={{ padding: '1.25rem' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1rem',
          }}
        >
          <div>
            <strong>#{wo.number}</strong>{' '}
            <span className="muted">
              {WO_TYPE_LABELS[wo.type] ?? wo.type}
            </span>
            <h2 style={{ margin: '0.35rem 0 0' }}>{wo.title}</h2>
          </div>
          <div style={{ textAlign: 'end' }}>
            <div className="badge">
              {WO_STATUS_LABELS[wo.status] ?? wo.status}
            </div>
            <div className="muted" style={{ marginTop: '0.35rem' }}>
              {PRIORITY_LABELS[wo.priority] ?? wo.priority}
            </div>
          </div>
        </header>

        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <div>
            <dt className="muted">الفني</dt>
            <dd>{wo.assignee?.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="muted">الأصل</dt>
            <dd>{wo.asset?.label ?? '—'}</dd>
          </div>
          <div>
            <dt className="muted">الموقع</dt>
            <dd>{wo.locationText || '—'}</dd>
          </div>
          <div>
            <dt className="muted">الاستجابة قبل</dt>
            <dd>{formatDt(wo.respondBy)}</dd>
          </div>
          <div>
            <dt className="muted">الإنجاز قبل</dt>
            <dd>{formatDt(wo.resolveBy)}</dd>
          </div>
          {wo.request ? (
            <div>
              <dt className="muted">البلاغ</dt>
              <dd>#{wo.request.number}</dd>
            </div>
          ) : null}
        </dl>

        <section style={{ marginTop: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem' }}>الوصف</h3>
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            {wo.description || '—'}
          </p>
        </section>

        {wo.completionNotes ? (
          <section style={{ marginTop: '1rem' }}>
            <h3 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem' }}>
              تقرير الإنجاز الفني
            </h3>
            <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
              {wo.completionNotes}
            </p>
          </section>
        ) : null}

        {wo.rootCause ? (
          <section style={{ marginTop: '1rem' }}>
            <h3 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem' }}>
              السبب الجذري
            </h3>
            <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{wo.rootCause}</p>
          </section>
        ) : null}

        {wo.reviewNotes || wo.reviewedBy ? (
          <section style={{ marginTop: '1rem' }}>
            <h3 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem' }}>
              اعتماد المشرف
            </h3>
            <p className="muted" style={{ margin: '0 0 0.35rem' }}>
              {wo.reviewedBy?.name ?? '—'} — {formatDt(wo.reviewedAt)}
            </p>
            <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
              {wo.reviewNotes || '—'}
            </p>
          </section>
        ) : null}

        <WorkOrderAttachments
          workOrderId={wo.id}
          attachments={wo.attachments ?? []}
          canUpload={
            (canExecute &&
              ['in_progress', 'rework', 'waiting_parts', 'waiting_access'].includes(
                wo.status,
              )) ||
            (canSupervise && wo.status === 'done_field')
          }
          onUploaded={reload}
        />

        {wo.partsRequests?.length ? (
          <section style={{ marginTop: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>
              طلبات القطع
            </h3>
            <ul style={{ margin: 0, paddingInlineStart: '1.1rem' }}>
              {wo.partsRequests.map((p) => (
                <li key={p.id}>
                  {p.description} ×{p.quantity} —{' '}
                  {PARTS_STATUS_LABELS[p.status] ?? p.status}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {wo.assignmentRejectReason ? (
          <p className="error" style={{ marginTop: '1rem' }}>
            رفض التعيين: {wo.assignmentRejectReason}
          </p>
        ) : null}
        {wo.reworkReason ? (
          <p className="error" style={{ marginTop: '1rem' }}>
            سبب الإعادة: {wo.reworkReason}
          </p>
        ) : null}

        <section style={{ marginTop: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>
            سجل الحالات
          </h3>
          <ul style={{ margin: 0, paddingInlineStart: '1.1rem' }}>
            {wo.statusEvents.map((e) => (
              <li key={e.id} style={{ marginBottom: '0.35rem' }}>
                <strong>
                  {WO_STATUS_LABELS[e.fromStatus] ?? e.fromStatus}
                </strong>
                {' → '}
                <strong>{WO_STATUS_LABELS[e.toStatus] ?? e.toStatus}</strong>
                <span className="muted">
                  {' '}
                  — {e.actor?.name ?? '—'} — {formatDt(e.createdAt)}
                </span>
                {e.reason ? <div className="muted">{e.reason}</div> : null}
              </li>
            ))}
          </ul>
        </section>
      </article>

      <Modal
        open={rejectOpen}
        title="رفض التعيين"
        onClose={() => setRejectOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setRejectOpen(false)}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="btn danger"
              disabled={rejectReason.trim().length < 2}
              onClick={() => {
                void (async () => {
                  await run(
                    () => rejectAssignment(wo.id, rejectReason.trim()),
                    'أُعيد للتوزيع',
                  );
                  setRejectOpen(false);
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
        open={finishOpen}
        title="إنجاز فني"
        onClose={() => setFinishOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setFinishOpen(false)}
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="finish-field-form"
              className="btn"
              disabled={notes.trim().length < 2}
            >
              إرسال للمراجعة
            </button>
          </>
        }
      >
        <form
          id="finish-field-form"
          className="form form-wide"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void (async () => {
              await run(
                () =>
                  finishFieldWorkOrder(wo.id, {
                    completionNotes: notes.trim(),
                    rootCause: rootCause.trim() || undefined,
                  }),
                'بانتظار المراجعة',
              );
              setFinishOpen(false);
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
        open={reworkOpen}
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
                void (async () => {
                  await run(
                    () => reworkWorkOrder(wo.id, reworkReason.trim()),
                    'أُعيد للتنفيذ',
                  );
                  setReworkOpen(false);
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
          value={reworkReason}
          onChange={(e) => setReworkReason(e.target.value)}
          placeholder="سبب رفض المراجعة…"
        />
      </Modal>

      <Modal
        open={partsOpen}
        title="طلب قطع غيار"
        onClose={() => setPartsOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setPartsOpen(false)}
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="parts-form"
              className="btn"
              disabled={partsDesc.trim().length < 2}
            >
              إرسال الطلب
            </button>
          </>
        }
      >
        <form
          id="parts-form"
          className="form form-wide"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void (async () => {
              await run(
                () =>
                  createPartsRequest(wo.id, {
                    description: partsDesc.trim(),
                    quantity: partsQty,
                    setWaiting: true,
                  }),
                'تم طلب القطع',
              );
              setPartsOpen(false);
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

      <Modal
        open={closeOpen}
        title="اعتماد وإغلاق"
        onClose={() => setCloseOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setCloseOpen(false)}
            >
              إلغاء
            </button>
            <button type="submit" form="close-review-form" className="btn">
              تأكيد الإغلاق
            </button>
          </>
        }
      >
        <form
          id="close-review-form"
          className="form form-wide"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void (async () => {
              await run(
                () =>
                  closeWorkOrder(
                    wo.id,
                    reviewNotes.trim() || undefined,
                  ),
                'تم الاعتماد والإغلاق',
              );
              setCloseOpen(false);
            })();
          }}
        >
          <p className="muted" style={{ margin: 0 }}>
            راجع تقرير الإنجاز ثم اعتمد الأمر. الملاحظات تُحفظ في السجل.
          </p>
          <label>
            ملاحظات الاعتماد (اختياري)
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />
          </label>
        </form>
      </Modal>
    </div>
  );
}
