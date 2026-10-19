'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  PUBLIC_LOGIN_ENDPOINTS,
  getLoginSecurity,
  updateLoginSecurity,
} from '@/features/page_management/api';
import type { LoginSecuritySettings } from '@/features/page_management/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  CopyApiIcon,
  TaskCard,
  notifyMutation,
  useToast,
} from '@/shared/ui';

/** بطاقة إعدادات أمان الدخول — عدد المحاولات ومدة الحظر (Hot Blocker) */
export function LoginSecurityCard() {
  const toast = useToast();
  const [settings, setSettings] = useState<LoginSecuritySettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PAGE_LOGIN_SECURITY_READ);
  const canUpdate = can(PERMISSIONS.PAGE_LOGIN_SECURITY_UPDATE);

  async function reload() {
    try {
      setSettings(await getLoginSecurity());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    reload();
  }, []);

  if (!canRead) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!settings || !canUpdate) return;
    setBusy(true);
    try {
      await notifyMutation(
        toast,
        () =>
          updateLoginSecurity({
            enabled: settings.enabled,
            tryCount: settings.tryCount,
            blockMinutes: settings.blockMinutes,
          }),
        { success: 'تم حفظ إعدادات الأمان' },
      );
      await reload();
    } catch {
      // الإشعار عبر notifyMutation
    } finally {
      setBusy(false);
    }
  }

  function patch<K extends keyof LoginSecuritySettings>(
    key: K,
    value: LoginSecuritySettings[K],
  ) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  return (
    <>
      {error ? <div className="error">{error}</div> : null}
      <TaskCard
        title="أمان تسجيل الدخول"
        actions={<CopyApiIcon path={PUBLIC_LOGIN_ENDPOINTS.security} />}
      >
        <p className="muted" style={{ marginBottom: 12 }}>
          الحظر يتم على جهاز المستخدم (كوكيز). من هنا تضبطون عدد المحاولات ومدة
          الحظر التي تقرأها صفحة الراوتر.
        </p>
        {!settings ? (
          <p className="muted">جاري التحميل…</p>
        ) : (
          <form className="form" onSubmit={submit}>
            <label>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => patch('enabled', e.target.checked)}
                  disabled={!canUpdate}
                />
                تفعيل حظر المحاولات الفاشلة
              </span>
            </label>
            <label>
              عدد المحاولات قبل الحظر
              <input
                type="number"
                min={1}
                max={100}
                value={settings.tryCount}
                onChange={(e) =>
                  patch('tryCount', Math.max(1, Number(e.target.value) || 1))
                }
                disabled={!canUpdate}
                required
              />
            </label>
            <label>
              مدة الحظر (بالدقائق)
              <input
                type="number"
                min={1}
                max={1440}
                value={settings.blockMinutes}
                onChange={(e) =>
                  patch(
                    'blockMinutes',
                    Math.max(1, Number(e.target.value) || 1),
                  )
                }
                disabled={!canUpdate}
                required
              />
            </label>
            {canUpdate ? (
              <div className="form-actions">
                <button className="btn" type="submit" disabled={busy}>
                  حفظ
                </button>
              </div>
            ) : null}
          </form>
        )}
      </TaskCard>
    </>
  );
}
