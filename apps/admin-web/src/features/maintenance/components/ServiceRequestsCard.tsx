'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  convertServiceRequest,
  createAsset,
  createServiceRequest,
  deleteServiceRequest,
  listAssetKinds,
  listAssets,
  listRequestPriorities,
  listRequestTypes,
  listServiceRequests,
  rejectServiceRequest,
  triageServiceRequest,
  type MetaOption,
} from '@/features/maintenance/api';
import type { Asset, ServiceRequest } from '@/features/maintenance/types';
import {
  PRIORITY_LABELS,
  REQUEST_STATUS_LABELS,
  WO_TYPE_LABELS,
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

export function ServiceRequestsCard() {
  const toast = useToast();
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.MAINTENANCE_READ);
  const canCreate = can(PERMISSIONS.MAINTENANCE_REQUEST_CREATE);
  const canTriage = can(PERMISSIONS.MAINTENANCE_TRIAGE);
  const canDelete = can(PERMISSIONS.MAINTENANCE_DELETE);

  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [types, setTypes] = useState<MetaOption[]>([]);
  const [priorities, setPriorities] = useState<MetaOption[]>([]);
  const [kinds, setKinds] = useState<MetaOption[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(false);
  const [triageRow, setTriageRow] = useState<ServiceRequest | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteRow, setDeleteRow] = useState<ServiceRequest | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workType, setWorkType] = useState('corrective');
  const [priority, setPriority] = useState('p3');
  const [assetId, setAssetId] = useState('');
  const [locationText, setLocationText] = useState('');
  const [triageNotes, setTriageNotes] = useState('');

  const [assetKind, setAssetKind] = useState('subscriber');
  const [assetLabel, setAssetLabel] = useState('');
  const [assetRef, setAssetRef] = useState('');

  async function reload() {
    try {
      const [rows, t, p, a, k] = await Promise.all([
        listServiceRequests(),
        listRequestTypes(),
        listRequestPriorities(),
        listAssets(),
        listAssetKinds(),
      ]);
      setItems(rows);
      setTypes(t);
      setPriorities(p);
      setAssets(a);
      setKinds(k);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  if (!canRead) return null;

  function openTriage(r: ServiceRequest) {
    setTriageRow(r);
    setWorkType(r.workType);
    setPriority(r.priority);
    setAssetId(r.assetId ?? '');
    setLocationText(r.locationText ?? '');
    setTriageNotes(r.triageNotes ?? '');
  }

  const columns: Column<ServiceRequest>[] = [
    { key: 'number', header: 'الرقم', render: (r) => r.number },
    { key: 'title', header: 'العنوان', render: (r) => r.title },
    {
      key: 'type',
      header: 'النوع',
      render: (r) => WO_TYPE_LABELS[r.workType] ?? r.workType,
    },
    {
      key: 'priority',
      header: 'الأولوية',
      render: (r) => PRIORITY_LABELS[r.priority] ?? r.priority,
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (r) => REQUEST_STATUS_LABELS[r.status] ?? r.status,
    },
    {
      key: 'wos',
      header: 'أوامر',
      render: (r) => r.workOrders?.length ?? 0,
    },
    {
      key: 'actions',
      header: '',
      render: (r) => {
        const canScreen =
          canTriage &&
          (r.status === 'submitted' || r.status === 'triaged');
        const canConvert =
          canTriage &&
          (canScreen ||
            (r.status === 'converted' && r.workType === 'outage'));
        if (!canScreen && !canConvert && !canDelete) return null;
        return (
          <div className="row-actions">
            {canScreen ? (
              <button
                type="button"
                className="btn secondary"
                onClick={() => openTriage(r)}
              >
                فرز
              </button>
            ) : null}
            {canConvert ? (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  void (async () => {
                    try {
                      await notifyMutation(
                        toast,
                        () => convertServiceRequest(r.id),
                        { success: 'تم إنشاء أمر العمل' },
                      );
                      await reload();
                    } catch {
                      /* toast */
                    }
                  })();
                }}
              >
                {r.status === 'converted' ? 'أمر عمل إضافي' : 'تحويل لأمر عمل'}
              </button>
            ) : null}
            {canScreen ? (
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
            ) : null}
            {canDelete ? (
              <button
                type="button"
                className="btn danger"
                onClick={() => setDeleteRow(r)}
              >
                حذف
              </button>
            ) : null}
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
          createServiceRequest({
            title: title.trim(),
            description: description.trim(),
            workType,
            priority,
            assetId: assetId || undefined,
            locationText: locationText.trim(),
            submit: true,
          }),
        { success: 'تم إنشاء البلاغ' },
      );
      setCreateOpen(false);
      setTitle('');
      setDescription('');
      await reload();
    } catch {
      /* toast */
    }
  }

  async function onTriage(e: FormEvent) {
    e.preventDefault();
    if (!triageRow) return;
    try {
      await notifyMutation(
        toast,
        () =>
          triageServiceRequest(triageRow.id, {
            workType,
            priority,
            assetId: assetId || undefined,
            locationText: locationText.trim(),
            triageNotes: triageNotes.trim(),
          }),
        { success: 'تم الفرز' },
      );
      setTriageRow(null);
      await reload();
    } catch {
      /* toast */
    }
  }

  async function onCreateAsset(e: FormEvent) {
    e.preventDefault();
    try {
      const row = await notifyMutation(
        toast,
        () =>
          createAsset({
            kind: assetKind,
            label: assetLabel.trim(),
            externalRef: assetRef.trim() || undefined,
          }),
        { success: 'تم إنشاء الأصل' },
      );
      setAssetOpen(false);
      setAssetLabel('');
      setAssetRef('');
      await reload();
      setAssetId(row.id);
    } catch {
      /* toast */
    }
  }

  return (
    <>
      <TaskCard
        title="البلاغات"
        actions={
          <div className="row-actions">
            {canTriage ? (
              <button
                type="button"
                className="btn secondary"
                onClick={() => setAssetOpen(true)}
              >
                أصل جديد
              </button>
            ) : null}
            {canCreate || canTriage ? (
              <button
                type="button"
                className="btn"
                onClick={() => setCreateOpen(true)}
              >
                بلاغ جديد
              </button>
            ) : null}
          </div>
        }
      >
        {error ? <p className="error">{error}</p> : null}
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          emptyText="لا توجد بلاغات"
        />
      </TaskCard>

      <Modal
        open={createOpen}
        title="بلاغ جديد"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setCreateOpen(false)}
            >
              إلغاء
            </button>
            <button type="submit" form="create-request-form" className="btn">
              إرسال للفرز
            </button>
          </>
        }
      >
        <form
          id="create-request-form"
          className="form form-wide"
          onSubmit={onCreate}
        >
          <label>
            العنوان
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
            />
          </label>
          <div className="form-grid-2">
            <label>
              النوع
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
              >
                {types.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              الأولوية
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {priorities.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            الأصل
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
            >
              <option value="">—</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            الموقع
            <input
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
            />
          </label>
          <label>
            الوصف
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(triageRow)}
        title={triageRow ? `فرز بلاغ #${triageRow.number}` : 'فرز'}
        onClose={() => setTriageRow(null)}
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setTriageRow(null)}
            >
              إلغاء
            </button>
            <button type="submit" form="triage-form" className="btn">
              حفظ الفرز
            </button>
          </>
        }
      >
        <form id="triage-form" className="form form-wide" onSubmit={onTriage}>
          <p className="muted" style={{ margin: 0 }}>
            {triageRow?.title}
          </p>
          <div className="form-grid-2">
            <label>
              النوع
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
              >
                {types.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              الأولوية
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {priorities.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            الأصل
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
            >
              <option value="">—</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            الموقع
            <input
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
            />
          </label>
          <label>
            ملاحظات الفرز
            <textarea
              rows={3}
              value={triageNotes}
              onChange={(e) => setTriageNotes(e.target.value)}
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={assetOpen}
        title="أصل جديد"
        onClose={() => setAssetOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setAssetOpen(false)}
            >
              إلغاء
            </button>
            <button type="submit" form="create-asset-form" className="btn">
              حفظ
            </button>
          </>
        }
      >
        <form
          id="create-asset-form"
          className="form form-wide"
          onSubmit={onCreateAsset}
        >
          <label>
            النوع
            <select
              value={assetKind}
              onChange={(e) => setAssetKind(e.target.value)}
            >
              {kinds.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            الاسم / التسمية
            <input
              value={assetLabel}
              onChange={(e) => setAssetLabel(e.target.value)}
              required
              minLength={2}
            />
          </label>
          <label>
            مرجع خارجي (اختياري)
            <input
              value={assetRef}
              onChange={(e) => setAssetRef(e.target.value)}
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(rejectId)}
        title="رفض البلاغ"
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
                        rejectServiceRequest(rejectId, rejectReason.trim()),
                      { success: 'تم رفض البلاغ' },
                    );
                    setRejectId(null);
                    await reload();
                  } catch {
                    /* toast */
                  }
                })();
              }}
            >
              تأكيد الرفض
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

      <Modal
        open={Boolean(deleteRow)}
        title="حذف البلاغ"
        onClose={() => setDeleteRow(null)}
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setDeleteRow(null)}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                if (!deleteRow) return;
                void (async () => {
                  try {
                    await notifyMutation(
                      toast,
                      () => deleteServiceRequest(deleteRow.id),
                      {
                        success:
                          deleteRow.workOrders?.length
                            ? `تم حذف البلاغ و${deleteRow.workOrders.length} أمر عمل مرتبط`
                            : 'تم حذف البلاغ',
                      },
                    );
                    setDeleteRow(null);
                    await reload();
                  } catch {
                    /* toast */
                  }
                })();
              }}
            >
              تأكيد الحذف
            </button>
          </>
        }
      >
        <div className="form form-wide">
          <p style={{ margin: 0 }}>
            هل تريد حذف البلاغ{' '}
            <strong>#{deleteRow?.number}</strong> — {deleteRow?.title}؟
          </p>
          <p className="muted" style={{ margin: '0.5rem 0 0' }}>
            {(deleteRow?.workOrders?.length ?? 0) > 0
              ? `سيُحذف أيضاً ${deleteRow?.workOrders?.length} أمر عمل مرتبط مع المرفقات والسجلات.`
              : 'لا توجد أوامر عمل مرتبطة.'}
          </p>
        </div>
      </Modal>
    </>
  );
}
