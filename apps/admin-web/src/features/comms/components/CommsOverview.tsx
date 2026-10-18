'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  createExtension,
  deleteExtension,
  getAsteriskStatus,
  listActiveCalls,
  listCdr,
  listExtensions,
  updateExtension,
} from '@/features/comms/api';
import type {
  ActiveCall,
  AsteriskStatus,
  CdrItem,
  ExtensionItem,
  ExtensionPresence,
} from '@/features/comms/types';
import { usePermissions } from '@/lib/usePermissions';
import { TaskCard, notifyMutation, useToast } from '@/shared/ui';

type Tab = 'extensions' | 'active' | 'cdr';

const PRESENCE_LABEL: Record<ExtensionPresence, string> = {
  online: 'متصل',
  offline: 'غير متصل',
  busy: 'مشغول',
  unknown: 'غير معروف',
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('ar', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function CommsOverview() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.COMMS_READ);
  const canCreate = can(PERMISSIONS.COMMS_CREATE);
  const canUpdate = can(PERMISSIONS.COMMS_UPDATE);
  const canDelete = can(PERMISSIONS.COMMS_DELETE);
  const toast = useToast();

  const [tab, setTab] = useState<Tab>('extensions');
  const [status, setStatus] = useState<AsteriskStatus | null>(null);
  const [extensions, setExtensions] = useState<ExtensionItem[]>([]);
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [cdr, setCdr] = useState<CdrItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [number, setNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [secret, setSecret] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSecret, setEditSecret] = useState('');

  const [cdrQ, setCdrQ] = useState('');

  const reloadStatus = useCallback(async () => {
    const next = await getAsteriskStatus();
    setStatus(next);
  }, []);

  const reloadExtensions = useCallback(async () => {
    const rows = await listExtensions();
    setExtensions(rows);
  }, []);

  const reloadActive = useCallback(async () => {
    const rows = await listActiveCalls();
    setActiveCalls(rows);
  }, []);

  const reloadCdr = useCallback(async (q?: string) => {
    const rows = await listCdr({ q: q || undefined, limit: 100 });
    setCdr(rows);
  }, []);

  const reloadAll = useCallback(async () => {
    setBusy(true);
    try {
      await Promise.all([
        reloadStatus(),
        reloadExtensions(),
        reloadActive(),
        reloadCdr(cdrQ),
      ]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل بيانات الاتصال');
    } finally {
      setBusy(false);
    }
  }, [reloadStatus, reloadExtensions, reloadActive, reloadCdr, cdrQ]);

  useEffect(() => {
    if (!canRead) return;
    void reloadAll();
  }, [canRead, reloadAll]);

  useEffect(() => {
    if (!canRead || tab !== 'active') return;
    const id = window.setInterval(() => void reloadActive(), 4000);
    return () => window.clearInterval(id);
  }, [canRead, tab, reloadActive]);

  if (!canRead) {
    return (
      <TaskCard title="الاتصال">
        <p className="muted">ليست لديك صلاحية عرض قسم الاتصال</p>
      </TaskCard>
    );
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) return;
    try {
      await notifyMutation(
        toast,
        () =>
          createExtension({
            number: number.trim(),
            displayName: displayName.trim(),
            secret,
          }),
        { success: 'تم إضافة الرقم', error: 'تعذر إضافة الرقم' },
      );
      setNumber('');
      setDisplayName('');
      setSecret('');
      await reloadExtensions();
    } catch {
      /* toast */
    }
  }

  async function onSaveEdit(id: string) {
    if (!canUpdate) return;
    try {
      await notifyMutation(
        toast,
        () =>
          updateExtension(id, {
            displayName: editName.trim() || undefined,
            secret: editSecret.trim() || undefined,
          }),
        { success: 'تم تحديث الرقم', error: 'تعذر تحديث الرقم' },
      );
      setEditingId(null);
      setEditSecret('');
      await reloadExtensions();
    } catch {
      /* toast */
    }
  }

  async function onToggleEnabled(row: ExtensionItem) {
    if (!canUpdate) return;
    try {
      await notifyMutation(
        toast,
        () => updateExtension(row.id, { enabled: !row.enabled }),
        {
          success: row.enabled ? 'تم تعطيل الرقم' : 'تم تفعيل الرقم',
          error: 'تعذر تغيير الحالة',
        },
      );
      await reloadExtensions();
    } catch {
      /* toast */
    }
  }

  async function onDelete(row: ExtensionItem) {
    if (!canDelete) return;
    if (!confirm(`حذف الرقم الداخلي ${row.number}؟`)) return;
    try {
      await notifyMutation(toast, () => deleteExtension(row.id), {
        success: 'تم حذف الرقم',
        error: 'تعذر حذف الرقم',
      });
      await reloadExtensions();
    } catch {
      /* toast */
    }
  }

  return (
    <div className="task-stack">
      <TaskCard
        title="حالة Asterisk"
        actions={
          <button
            type="button"
            className="btn secondary"
            disabled={busy}
            onClick={() => void reloadAll()}
          >
            تحديث
          </button>
        }
      >
        {error ? <p className="error-text">{error}</p> : null}
        {status ? (
          <>
            <p
              className={[
                'comms-banner',
                status.connected ? 'is-ok' : 'is-err',
              ].join(' ')}
            >
              {status.message}
            </p>
            <dl className="comms-status">
              <div>
                <dt>الاتصال</dt>
                <dd>{status.connected ? 'متصل' : 'غير متصل'}</dd>
              </div>
              <div>
                <dt>الإصدار</dt>
                <dd>
                  <code dir="ltr">{status.version || '—'}</code>
                </dd>
              </div>
              <div>
                <dt>بدء التشغيل</dt>
                <dd>{status.startupDate || '—'}</dd>
              </div>
              <div>
                <dt>مكالمات نشطة</dt>
                <dd>{status.callsActive ?? '—'}</dd>
              </div>
              <div>
                <dt>مكالمات معالجة</dt>
                <dd>{status.callsProcessed ?? '—'}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="muted">{busy ? 'جارٍ التحميل…' : '—'}</p>
        )}
      </TaskCard>

      <TaskCard title="إدارة الاتصال">
        <div className="comms-tabs">
          <button
            type="button"
            className={tab === 'extensions' ? 'is-active' : ''}
            onClick={() => setTab('extensions')}
          >
            الأرقام الداخلية
          </button>
          <button
            type="button"
            className={tab === 'active' ? 'is-active' : ''}
            onClick={() => setTab('active')}
          >
            المكالمات الجارية
          </button>
          <button
            type="button"
            className={tab === 'cdr' ? 'is-active' : ''}
            onClick={() => setTab('cdr')}
          >
            سجل المكالمات
          </button>
        </div>

        {tab === 'extensions' ? (
          <>
            {canCreate ? (
              <form className="comms-form" onSubmit={(e) => void onCreate(e)}>
                <label>
                  الرقم
                  <input
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="1001"
                    required
                    dir="ltr"
                  />
                </label>
                <label>
                  الاسم
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="اسم الهاتف"
                    required
                  />
                </label>
                <label>
                  كلمة المرور
                  <input
                    type="text"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    required
                    dir="ltr"
                  />
                </label>
                <button type="submit" className="btn">
                  إضافة رقم
                </button>
              </form>
            ) : null}

            <div className="comms-table-wrap">
              <table className="comms-table">
                <thead>
                  <tr>
                    <th>الرقم</th>
                    <th>الاسم</th>
                    <th>الحالة</th>
                    <th>التسجيل</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {extensions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="muted">
                        لا توجد أرقام بعد
                      </td>
                    </tr>
                  ) : (
                    extensions.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <code dir="ltr">{row.number}</code>
                        </td>
                        <td>
                          {editingId === row.id ? (
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          ) : (
                            row.displayName
                          )}
                        </td>
                        <td>{row.enabled ? 'مفعّل' : 'معطّل'}</td>
                        <td>
                          <span
                            className={`comms-presence is-${row.presence}`}
                          >
                            {PRESENCE_LABEL[row.presence]}
                          </span>
                        </td>
                        <td>
                          <div className="comms-row-actions">
                            {editingId === row.id ? (
                              <>
                                <input
                                  placeholder="كلمة مرور جديدة (اختياري)"
                                  value={editSecret}
                                  onChange={(e) => setEditSecret(e.target.value)}
                                  dir="ltr"
                                />
                                <button
                                  type="button"
                                  className="btn"
                                  onClick={() => void onSaveEdit(row.id)}
                                >
                                  حفظ
                                </button>
                                <button
                                  type="button"
                                  className="btn secondary"
                                  onClick={() => setEditingId(null)}
                                >
                                  إلغاء
                                </button>
                              </>
                            ) : (
                              <>
                                {canUpdate ? (
                                  <>
                                    <button
                                      type="button"
                                      className="btn secondary"
                                      onClick={() => {
                                        setEditingId(row.id);
                                        setEditName(row.displayName);
                                        setEditSecret('');
                                      }}
                                    >
                                      تعديل
                                    </button>
                                    <button
                                      type="button"
                                      className="btn secondary"
                                      onClick={() => void onToggleEnabled(row)}
                                    >
                                      {row.enabled ? 'تعطيل' : 'تفعيل'}
                                    </button>
                                  </>
                                ) : null}
                                {canDelete ? (
                                  <button
                                    type="button"
                                    className="btn secondary"
                                    onClick={() => void onDelete(row)}
                                  >
                                    حذف
                                  </button>
                                ) : null}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {tab === 'active' ? (
          <div className="comms-table-wrap">
            <table className="comms-table">
              <thead>
                <tr>
                  <th>المتصل</th>
                  <th>المطلوب</th>
                  <th>الحالة</th>
                  <th>التطبيق</th>
                  <th>المدة</th>
                  <th>القناة</th>
                </tr>
              </thead>
              <tbody>
                {activeCalls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted">
                      لا توجد مكالمات جارية
                    </td>
                  </tr>
                ) : (
                  activeCalls.map((call) => (
                    <tr key={call.channel}>
                      <td dir="ltr">
                        {call.callerIdNum || '—'}{' '}
                        <span className="muted">{call.callerIdName}</span>
                      </td>
                      <td dir="ltr">
                        {call.connectedLineNum || '—'}{' '}
                        <span className="muted">{call.connectedLineName}</span>
                      </td>
                      <td>{call.state || '—'}</td>
                      <td>{call.application || '—'}</td>
                      <td dir="ltr">{call.duration || '—'}</td>
                      <td>
                        <code dir="ltr">{call.channel}</code>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === 'cdr' ? (
          <>
            <div className="comms-filters">
              <label>
                بحث
                <input
                  value={cdrQ}
                  onChange={(e) => setCdrQ(e.target.value)}
                  placeholder="رقم أو اسم…"
                />
              </label>
              <button
                type="button"
                className="btn secondary"
                onClick={() => void reloadCdr(cdrQ)}
              >
                بحث
              </button>
            </div>
            <div className="comms-table-wrap">
              <table className="comms-table">
                <thead>
                  <tr>
                    <th>الوقت</th>
                    <th>من</th>
                    <th>إلى</th>
                    <th>النتيجة</th>
                    <th>المدة</th>
                    <th>المحتسبة</th>
                  </tr>
                </thead>
                <tbody>
                  {cdr.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="muted">
                        لا سجلات بعد
                      </td>
                    </tr>
                  ) : (
                    cdr.map((row) => (
                      <tr key={row.uniqueid}>
                        <td>{formatDate(row.calldate)}</td>
                        <td dir="ltr">{row.src || '—'}</td>
                        <td dir="ltr">{row.dst || '—'}</td>
                        <td>{row.disposition || '—'}</td>
                        <td dir="ltr">{row.duration}s</td>
                        <td dir="ltr">{row.billsec}s</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </TaskCard>
    </div>
  );
}
