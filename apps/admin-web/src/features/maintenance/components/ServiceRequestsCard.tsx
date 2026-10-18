'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  assignWorkOrder,
  convertServiceRequest,
  createServiceRequest,
  deleteServiceRequest,
  listAssets,
  listRequestPriorities,
  listRequestTypes,
  listServiceRequests,
  listWorkOrderMembers,
  rejectServiceRequest,
  uploadServiceRequestAttachment,
  type MetaOption,
} from '@/features/maintenance/api';
import type {
  Asset,
  ServiceRequest,
  UserBrief,
} from '@/features/maintenance/types';
import {
  PRIORITY_LABELS,
  REQUEST_STATUS_LABELS,
  WO_TYPE_LABELS,
} from '@/features/maintenance/types';
import { usePermissions } from '@/lib/usePermissions';
import { FormPanelTabs } from '@/features/maintenance/components/FormPanelTabs';
import { PendingAttachmentsField } from '@/features/maintenance/components/PendingAttachmentsField';
import { ServiceRequestAttachments } from '@/features/maintenance/components/ServiceRequestAttachments';
import {
  DataTable,
  Modal,
  TaskCard,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';

const FORM_TABS = [
  { id: 'details', label: 'تفاصيل' },
  { id: 'attachments', label: 'مرفقات' },
] as const;

type FormTabId = (typeof FORM_TABS)[number]['id'];

export function ServiceRequestsCard() {
  const toast = useToast();
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.MAINTENANCE_READ);
  const canCreate = can(PERMISSIONS.MAINTENANCE_REQUEST_CREATE);
  const canTriage = can(PERMISSIONS.MAINTENANCE_TRIAGE);
  const canDispatch = can(PERMISSIONS.MAINTENANCE_DISPATCH);
  const canDelete = can(PERMISSIONS.MAINTENANCE_DELETE);

  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [types, setTypes] = useState<MetaOption[]>([]);
  const [priorities, setPriorities] = useState<MetaOption[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [members, setMembers] = useState<UserBrief[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createTab, setCreateTab] = useState<FormTabId>('details');
  const [convertTab, setConvertTab] = useState<FormTabId>('details');
  const [createPendingFiles, setCreatePendingFiles] = useState<File[]>([]);
  const [convertPendingFiles, setConvertPendingFiles] = useState<File[]>([]);
  const [convertRow, setConvertRow] = useState<ServiceRequest | null>(null);
  /** بعد التحويل — يظهر حقل التعيين */
  const [createdWorkOrderId, setCreatedWorkOrderId] = useState<string | null>(
    null,
  );
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteRow, setDeleteRow] = useState<ServiceRequest | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workType, setWorkType] = useState('corrective');
  const [priority, setPriority] = useState('p3');
  const [assetId, setAssetId] = useState('');
  const [locationText, setLocationText] = useState('');
  const [notes, setNotes] = useState('');
  const [assigneeUserId, setAssigneeUserId] = useState('');
  const [busy, setBusy] = useState(false);

  /** خيارات نموذج الإضافة */
  const [createConvert, setCreateConvert] = useState(false);
  const [createAssigneeId, setCreateAssigneeId] = useState('');

  const assignUnlocked = Boolean(createdWorkOrderId);

  async function reload() {
    try {
      const [rows, t, p, a, m] = await Promise.all([
        listServiceRequests(),
        listRequestTypes(),
        listRequestPriorities(),
        listAssets(),
        listWorkOrderMembers(),
      ]);
      setItems(rows);
      setTypes(t);
      setPriorities(p);
      setAssets(a);
      setMembers(m);
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

  function openConvert(r: ServiceRequest) {
    setConvertRow(r);
    setConvertTab('details');
    setConvertPendingFiles([]);
    setWorkType(r.workType);
    setPriority(r.priority);
    setAssetId(r.assetId ?? '');
    setLocationText(r.locationText ?? '');
    setNotes(r.triageNotes ?? '');
    setAssigneeUserId('');
    setCreatedWorkOrderId(null);
  }

  function closeConvert() {
    setConvertRow(null);
    setConvertTab('details');
    setConvertPendingFiles([]);
    setCreatedWorkOrderId(null);
    setAssigneeUserId('');
    setBusy(false);
  }

  async function uploadPending(
    requestId: string,
    files: File[],
  ): Promise<void> {
    for (const file of files) {
      await uploadServiceRequestAttachment(requestId, file);
    }
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
        const canConvert =
          canTriage &&
          (r.status === 'triaged' ||
            r.status === 'submitted' ||
            (r.status === 'converted' && r.workType === 'outage'));
        const canReject =
          canTriage &&
          (r.status === 'triaged' || r.status === 'submitted');
        if (!canConvert && !canReject && !canDelete) return null;
        return (
          <div className="row-actions">
            {canConvert ? (
              <button
                type="button"
                className="btn"
                onClick={() => openConvert(r)}
              >
                {r.status === 'converted' ? 'أمر عمل إضافي' : 'تحويل لأمر عمل'}
              </button>
            ) : null}
            {canReject ? (
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

  function resetCreateForm() {
    setTitle('');
    setDescription('');
    setWorkType('corrective');
    setPriority('p3');
    setAssetId('');
    setLocationText('');
    setCreateConvert(false);
    setCreateAssigneeId('');
    setCreateTab('details');
    setCreatePendingFiles([]);
  }

  function renderAssetField(disabled = false) {
    return (
      <label>
        الأصل
        <select
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          disabled={disabled}
        >
          <option value="">—</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) {
      toast.error('العنوان مطلوب (3 أحرف على الأقل)');
      setCreateTab('details');
      return;
    }
    if (createConvert && !canTriage) {
      toast.error('التحويل يتطلب صلاحية الفرز/التحويل');
      return;
    }
    if (createConvert && createAssigneeId && !canDispatch) {
      toast.error('التعيين يتطلب صلاحية التوزيع');
      return;
    }
    try {
      const successMsg = createConvert
        ? createAssigneeId
          ? 'تم حفظ البلاغ وتحويله وتعيين الفني'
          : 'تم حفظ البلاغ وتحويله لأمر عمل'
        : 'تم إنشاء البلاغ — جاهز للتحويل';
      await notifyMutation(
        toast,
        async () => {
          /** إنشاء أولاً ثم رفع المرفقات ثم التحويل — لنسخها إلى أمر العمل */
          const created = await createServiceRequest({
            title: title.trim(),
            description: description.trim(),
            workType,
            priority,
            assetId: assetId || undefined,
            locationText: locationText.trim(),
            submit: true,
          });
          if (createPendingFiles.length) {
            await uploadPending(created.id, createPendingFiles);
          }
          if (createConvert) {
            return convertServiceRequest(created.id, {
              approve: true,
              assigneeUserId: createAssigneeId || undefined,
            });
          }
          return created;
        },
        { success: successMsg },
      );
      setCreateOpen(false);
      resetCreateForm();
      await reload();
    } catch {
      /* toast */
    }
  }

  async function onConvert() {
    if (!convertRow) return;
    setBusy(true);
    try {
      if (convertPendingFiles.length) {
        await uploadPending(convertRow.id, convertPendingFiles);
        setConvertPendingFiles([]);
      }
      const updated = await notifyMutation(
        toast,
        () =>
          convertServiceRequest(convertRow.id, {
            workType,
            priority,
            assetId: assetId || undefined,
            locationText: locationText.trim(),
            triageNotes: notes.trim(),
          }),
        { success: 'تم التحويل — يمكنك التعيين الآن' },
      );
      const newest = updated.workOrders?.[0];
      if (!newest?.id) {
        toast.error('تم التحويل لكن لم يُعثر على أمر العمل');
        closeConvert();
        await reload();
        return;
      }
      setCreatedWorkOrderId(newest.id);
      setConvertRow(updated);
      await reload();
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  async function onAssign() {
    if (!createdWorkOrderId) return;
    if (!assigneeUserId) {
      toast.error('اختر الفني للتعيين');
      return;
    }
    if (!canDispatch) {
      toast.error('لا تملك صلاحية التوزيع');
      return;
    }
    setBusy(true);
    try {
      await notifyMutation(
        toast,
        () => assignWorkOrder(createdWorkOrderId, assigneeUserId),
        { success: 'تم تعيين الفني' },
      );
      closeConvert();
      await reload();
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TaskCard
        title="البلاغات"
        actions={
          canCreate || canTriage ? (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setCreateTab('details');
                setCreateOpen(true);
              }}
            >
              بلاغ جديد
            </button>
          ) : null
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
        onClose={() => {
          setCreateOpen(false);
          resetCreateForm();
        }}
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                setCreateOpen(false);
                resetCreateForm();
              }}
            >
              إلغاء
            </button>
            <button type="submit" form="create-request-form" className="btn">
              {createConvert
                ? createAssigneeId
                  ? 'حفظ وتحويل وتعيين'
                  : 'حفظ وتحويل لأمر عمل'
                : 'حفظ البلاغ'}
            </button>
          </>
        }
      >
        <form
          id="create-request-form"
          className="form form-wide"
          onSubmit={onCreate}
        >
          <FormPanelTabs
            tabs={[...FORM_TABS]}
            active={createTab}
            onChange={(id) => setCreateTab(id as FormTabId)}
          />

          {createTab === 'details' ? (
            <>
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

              {canTriage ? (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexDirection: 'row',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={createConvert}
                    onChange={(e) => {
                      setCreateConvert(e.target.checked);
                      if (!e.target.checked) setCreateAssigneeId('');
                    }}
                  />
                  <span>تحويل لأمر عمل فوراً</span>
                </label>
              ) : null}

              {canTriage && createConvert ? (
                canDispatch ? (
                  <label>
                    تعيين فني
                    <select
                      value={createAssigneeId}
                      onChange={(e) => setCreateAssigneeId(e.target.value)}
                    >
                      <option value="">— بدون تعيين الآن —</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.username})
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <p className="muted" style={{ margin: 0 }}>
                    سيُحوَّل لأمر عمل بدون تعيين — تحتاج صلاحية التوزيع للتعيين
                    المباشر.
                  </p>
                )
              ) : null}
            </>
          ) : (
            <>
              {renderAssetField()}
              <PendingAttachmentsField
                files={createPendingFiles}
                onChange={setCreatePendingFiles}
              />
            </>
          )}
        </form>
      </Modal>

      <Modal
        open={Boolean(convertRow)}
        title={
          convertRow
            ? assignUnlocked
              ? `تعيين أمر العمل — بلاغ #${convertRow.number}`
              : `تحويل بلاغ #${convertRow.number}`
            : 'تحويل'
        }
        onClose={closeConvert}
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={closeConvert}
              disabled={busy}
            >
              {assignUnlocked ? 'إغلاق' : 'إلغاء'}
            </button>
            {!assignUnlocked ? (
              <button
                type="button"
                className="btn"
                disabled={busy || !canTriage}
                onClick={() => {
                  void onConvert();
                }}
              >
                {busy ? 'جاري…' : 'تحويل لأمر عمل'}
              </button>
            ) : canDispatch ? (
              <button
                type="button"
                className="btn"
                disabled={busy || !assigneeUserId}
                onClick={() => {
                  void onAssign();
                }}
              >
                {busy ? 'جاري…' : 'تعيين الفني'}
              </button>
            ) : null}
          </>
        }
      >
        <div className="form form-wide">
          <p className="muted" style={{ margin: 0 }}>
            {convertRow?.title}
          </p>

          {!assignUnlocked ? (
            <>
              <FormPanelTabs
                tabs={[...FORM_TABS]}
                active={convertTab}
                onChange={(id) => setConvertTab(id as FormTabId)}
              />
              {convertTab === 'details' ? (
                <>
                  <div className="form-grid-2">
                    <label>
                      النوع
                      <select
                        value={workType}
                        onChange={(e) => setWorkType(e.target.value)}
                        disabled={busy}
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
                        disabled={busy}
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
                    الموقع
                    <input
                      value={locationText}
                      onChange={(e) => setLocationText(e.target.value)}
                      disabled={busy}
                    />
                  </label>
                  <label>
                    ملاحظات
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={busy}
                    />
                  </label>
                  <p className="muted" style={{ margin: 0 }}>
                    اضغط «تحويل لأمر عمل» أولاً، ثم سيظهر خيار التعيين.
                  </p>
                </>
              ) : (
                <>
                  {renderAssetField(busy)}
                  <ServiceRequestAttachments
                    attachments={convertRow?.attachments ?? []}
                  />
                  <PendingAttachmentsField
                    files={convertPendingFiles}
                    onChange={setConvertPendingFiles}
                    disabled={busy}
                    hint="تُرفع قبل التحويل وتُنسخ تلقائياً إلى أمر العمل"
                  />
                </>
              )}
            </>
          ) : (
            <>
              <p style={{ margin: 0 }}>
                تم إنشاء أمر العمل. اختر الفني ثم اضغط تعيين.
              </p>
              {canDispatch ? (
                <label>
                  الفني
                  <select
                    value={assigneeUserId}
                    onChange={(e) => setAssigneeUserId(e.target.value)}
                    disabled={busy}
                  >
                    <option value="">— اختر الفني —</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.username})
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  لا تملك صلاحية التوزيع — عيّن لاحقاً من أوامر العمل.
                </p>
              )}
            </>
          )}
        </div>
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
                        success: deleteRow.workOrders?.length
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
