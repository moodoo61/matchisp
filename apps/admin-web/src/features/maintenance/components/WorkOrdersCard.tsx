'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PERMISSIONS } from '@isp/shared';
import {
  assignWorkOrder,
  countPendingReview,
  listWorkOrderMembers,
  listWorkOrders,
} from '@/features/maintenance/api';
import type { UserBrief, WorkOrder } from '@/features/maintenance/types';
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

export function WorkOrdersCard() {
  const toast = useToast();
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.MAINTENANCE_READ);
  const canDispatch = can(PERMISSIONS.MAINTENANCE_DISPATCH);
  const canSupervise = can(PERMISSIONS.MAINTENANCE_SUPERVISE);

  const [items, setItems] = useState<WorkOrder[]>([]);
  const [members, setMembers] = useState<UserBrief[]>([]);
  const [pendingReview, setPendingReview] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [assignId, setAssignId] = useState<string | null>(null);
  const [assigneeUserId, setAssigneeUserId] = useState('');

  async function reload() {
    try {
      const [rows, m, review] = await Promise.all([
        listWorkOrders(),
        listWorkOrderMembers(),
        canSupervise
          ? countPendingReview()
          : Promise.resolve({ count: 0 }),
      ]);
      setItems(rows);
      setMembers(m);
      setPendingReview(review.count);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    if (!canRead) return;
    void reload();
  }, [canRead]);

  if (!canRead) return null;

  const columns: Column<WorkOrder>[] = [
    { key: 'number', header: 'الرقم', render: (r) => r.number },
    {
      key: 'title',
      header: 'العنوان',
      render: (r) => (
        <Link href={`/maintenance/work-orders/${r.id}`}>{r.title}</Link>
      ),
    },
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
      key: 'assignee',
      header: 'الفني',
      render: (r) => r.assignee?.name ?? '—',
    },
    {
      key: 'resolveBy',
      header: 'الإنجاز قبل',
      render: (r) => formatDt(r.resolveBy),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="row-actions">
          <Link
            href={`/maintenance/work-orders/${r.id}`}
            className="btn secondary"
          >
            فتح
          </Link>
          {canDispatch &&
          (r.status === 'approved' ||
            r.status === 'assigned' ||
            r.status === 'accepted') ? (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setAssignId(r.id);
                setAssigneeUserId(r.assigneeUserId ?? '');
              }}
            >
              تعيين
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <TaskCard
        title="أوامر العمل"
        actions={
          canSupervise && pendingReview > 0 ? (
            <Link href="/maintenance/review" className="btn">
              بانتظار المراجعة ({pendingReview})
            </Link>
          ) : canSupervise ? (
            <Link href="/maintenance/review" className="btn secondary">
              المراجعة
            </Link>
          ) : null
        }
      >
        {error ? <p className="error">{error}</p> : null}
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          emptyText="لا توجد أوامر عمل"
        />
      </TaskCard>

      <Modal
        open={Boolean(assignId)}
        title="تعيين فني"
        onClose={() => setAssignId(null)}
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setAssignId(null)}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="btn"
              disabled={!assigneeUserId}
              onClick={() => {
                if (!assignId || !assigneeUserId) return;
                void (async () => {
                  try {
                    await notifyMutation(
                      toast,
                      () => assignWorkOrder(assignId, assigneeUserId),
                      { success: 'تم التعيين' },
                    );
                    setAssignId(null);
                    await reload();
                  } catch {
                    /* toast */
                  }
                })();
              }}
            >
              حفظ
            </button>
          </>
        }
      >
        <label className="form form-wide">
          الفني
          <select
            value={assigneeUserId}
            onChange={(e) => setAssigneeUserId(e.target.value)}
          >
            <option value="">اختر…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </Modal>
    </>
  );
}
