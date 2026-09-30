'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  connectSstp,
  disconnectSstp,
  getSstpStatus,
  updateSstpSettings,
} from '@/features/settings/network/api';
import type { SstpStatus } from '@/features/settings/network/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  IconButton,
  TaskCard,
  notifyMutation,
  useToast,
} from '@/shared/ui';

export function SstpCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.NETWORK_SSTP_READ);
  const canManage = can(PERMISSIONS.NETWORK_SSTP_MANAGE);
  const toast = useToast();

  const [data, setData] = useState<SstpStatus | null>(null);
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [certWarn, setCertWarn] = useState(true);
  const [tlsExt, setTlsExt] = useState(true);
  const [autoConnect, setAutoConnect] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      const row = await getSstpStatus();
      setData(row);
      setHost(row.host);
      setUsername(row.username);
      setCertWarn(row.certWarn);
      setTlsExt(row.tlsExt);
      setAutoConnect(row.autoConnect);
      setPassword('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب حالة SSTP');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
  }, [canRead, reload]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    await notifyMutation(
      toast,
      async () => {
        await updateSstpSettings({
          host: host.trim(),
          username: username.trim(),
          password: password.trim() || undefined,
          certWarn,
          tlsExt,
          autoConnect,
        });
        return reload();
      },
      { success: 'تم حفظ إعدادات SSTP', error: 'تعذر الحفظ' },
    );
  }

  async function onConnect() {
    if (!canManage) return;
    if (!confirm('الاتصال بخادم SSTP الآن؟')) return;
    setBusy(true);
    try {
      await notifyMutation(toast, () => connectSstp(), {
        success: 'تم بدء الاتصال',
        error: 'فشل الاتصال',
      });
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function onDisconnect() {
    if (!canManage) return;
    if (!confirm('قطع اتصال SSTP؟')) return;
    setBusy(true);
    try {
      await notifyMutation(toast, () => disconnectSstp(), {
        success: 'تم قطع الاتصال',
        error: 'تعذر القطع',
      });
      await reload();
    } finally {
      setBusy(false);
    }
  }

  if (!canRead) return null;

  return (
    <TaskCard
      title="اتصال SSTP"
      actions={
        <IconButton label="تحديث" onClick={() => void reload()} disabled={busy}>
          ↻
        </IconButton>
      }
    >
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p className="muted">جاري التحميل…</p> : null}
      {data ? (
        <>
          <div className="sstp-status-row">
            <span
              className={`status-pill ${data.connected ? 'status-ok' : 'status-error'}`}
            >
              {data.connected ? 'متصل' : 'غير متصل'}
            </span>
            {data.autoConnect ? (
              <span className="status-pill status-degraded">اتصال تلقائي</span>
            ) : null}
            {!data.clientInstalled ? (
              <span className="error">
                sstp-client غير مثبت (`apt install sstp-client`)
              </span>
            ) : null}
            {data.pppInterfaces.length ? (
              <span className="muted mono" dir="ltr">
                {data.pppInterfaces
                  .map((i) => `${i.ifName} (${i.operState})`)
                  .join(', ')}
              </span>
            ) : null}
          </div>

          {data.probe ? (
            <p
              className={data.probe.tlsOk ? 'muted' : 'error'}
              style={{ marginTop: 0 }}
            >
              فحص الوصول: {data.probe.detail}
              {' · '}
              TCP {data.probe.tcpOk ? '✓' : '✗'} / TLS{' '}
              {data.probe.tlsOk ? '✓' : '✗'}
            </p>
          ) : null}
          {data.mikrotikHint ? (
            <p className="muted" style={{ marginTop: 0 }}>
              {data.mikrotikHint}
            </p>
          ) : null}

          <form className="form sstp-form" onSubmit={onSave}>
            <div className="sstp-form-row">
              <label>
                المضيف
                <input
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  required
                  disabled={!canManage || busy}
                  dir="ltr"
                />
              </label>
              <label>
                اسم المستخدم
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={!canManage || busy}
                  dir="ltr"
                />
              </label>
            </div>
            <div className="sstp-form-row">
              <label>
                كلمة المرور
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    data.passwordSet ? '•••••••• (اتركها فارغة للإبقاء)' : ''
                  }
                  disabled={!canManage || busy}
                  dir="ltr"
                  autoComplete="new-password"
                />
              </label>
              <div className="sstp-checks">
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={certWarn}
                    onChange={(e) => setCertWarn(e.target.checked)}
                    disabled={!canManage || busy}
                  />
                  تجاهل تحذير الشهادة
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={tlsExt}
                    onChange={(e) => setTlsExt(e.target.checked)}
                    disabled={!canManage || busy}
                  />
                  TLS hostname (SNI)
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={autoConnect}
                    onChange={(e) => setAutoConnect(e.target.checked)}
                    disabled={!canManage || busy}
                  />
                  اتصال تلقائي عند تشغيل النظام
                </label>
              </div>
            </div>

            {canManage ? (
              <div className="sstp-actions">
                <button className="btn" type="submit" disabled={busy}>
                  حفظ الإعدادات
                </button>
                {data.connected ? (
                  <button
                    type="button"
                    className="btn danger"
                    disabled={busy || !data.clientInstalled}
                    onClick={() => void onDisconnect()}
                  >
                    قطع الاتصال
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn secondary"
                    disabled={
                      busy || !data.clientInstalled || !data.hasCredentials
                    }
                    onClick={() => void onConnect()}
                  >
                    اتصال
                  </button>
                )}
              </div>
            ) : null}
          </form>

          {data.logTail ? (
            <details className="sstp-log">
              <summary>سجل الاتصال</summary>
              <pre dir="ltr">{data.logTail}</pre>
            </details>
          ) : null}
        </>
      ) : null}
    </TaskCard>
  );
}
