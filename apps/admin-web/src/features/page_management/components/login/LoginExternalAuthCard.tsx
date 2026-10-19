'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  PUBLIC_LOGIN_ENDPOINTS,
  getLoginExternalAuth,
  updateLoginExternalAuth,
} from '@/features/page_management/api';
import type { LoginExternalAuthSettings } from '@/features/page_management/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  CopyApiIcon,
  TaskCard,
  notifyMutation,
  useToast,
} from '@/shared/ui';

/** بطاقة مصادقة خارجية — دخول كمشترك */
export function LoginExternalAuthCard() {
  const toast = useToast();
  const [settings, setSettings] = useState<LoginExternalAuthSettings | null>(
    null,
  );
  const [restPassword, setRestPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PAGE_LOGIN_EXTERNAL_AUTH_READ);
  const canUpdate = can(PERMISSIONS.PAGE_LOGIN_EXTERNAL_AUTH_UPDATE);

  async function reload() {
    try {
      setSettings(await getLoginExternalAuth());
      setRestPassword('');
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
          updateLoginExternalAuth({
            enabled: settings.enabled,
            flowMode:
              settings.flowMode === 'redirect' ? 'redirect' : 'credentials',
            remoteUrl: settings.remoteUrl ?? '',
            httpMethod:
              settings.httpMethod === 'get' ? 'get' : 'post',
            restBaseUrl: settings.restBaseUrl ?? '',
            restUsername: settings.restUsername ?? '',
            ...(restPassword ? { restPassword } : {}),
            linkLabel: settings.linkLabel ?? '',
            sendMac: settings.sendMac,
            sendIp: settings.sendIp,
            sendUsername: settings.sendUsername,
            sendLinkLogin: settings.sendLinkLogin,
            sendLinkOrig: settings.sendLinkOrig,
            sendError: settings.sendError,
          }),
        { success: 'تم حفظ إعدادات المصادقة الخارجية' },
      );
      await reload();
    } catch {
      // notifyMutation
    } finally {
      setBusy(false);
    }
  }

  function patch<K extends keyof LoginExternalAuthSettings>(
    key: K,
    value: LoginExternalAuthSettings[K],
  ) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  const isCredentials = settings?.flowMode !== 'redirect';

  return (
    <>
      {error ? <div className="error">{error}</div> : null}
      <TaskCard
        title="مصادقة خارجية"
        actions={
          <CopyApiIcon path={PUBLIC_LOGIN_ENDPOINTS.externalAuth} />
        }
      >
        {!settings ? (
          <p className="muted">جاري التحميل…</p>
        ) : (
          <form className="form" onSubmit={submit}>
            <label className="check-row">
              <input
                type="checkbox"
                checked={!!settings.enabled}
                onChange={(e) => patch('enabled', e.target.checked)}
                disabled={!canUpdate}
              />
              تفعيل المصادقة الخارجية
            </label>

            <label>
              نمط العمل
              <select
                value={isCredentials ? 'credentials' : 'redirect'}
                onChange={(e) =>
                  patch(
                    'flowMode',
                    e.target.value as 'credentials' | 'redirect',
                  )
                }
                disabled={!canUpdate}
              >
                <option value="credentials">
                  حقول المشترك → تحقق REST → عودة للراوتر
                </option>
                <option value="redirect">توجيه فوري لبوابة ويب</option>
              </select>
            </label>

            <label>
              نص الرابط في الصفحة
              <input
                value={settings.linkLabel ?? ''}
                onChange={(e) => patch('linkLabel', e.target.value)}
                maxLength={80}
                disabled={!canUpdate}
              />
            </label>

            {isCredentials ? (
              <>
                <label>
                  عنوان REST على CHR (منفذ www)
                  <input
                    type="url"
                    value={settings.restBaseUrl ?? ''}
                    onChange={(e) => patch('restBaseUrl', e.target.value)}
                    placeholder="http://host:1616"
                    disabled={!canUpdate}
                    required={!!settings.enabled}
                  />
                </label>
                <label>
                  مستخدم API
                  <input
                    value={settings.restUsername ?? ''}
                    onChange={(e) => patch('restUsername', e.target.value)}
                    disabled={!canUpdate}
                    required={!!settings.enabled}
                    autoComplete="off"
                  />
                </label>
                <label>
                  كلمة مرور API
                  <input
                    type="password"
                    value={restPassword}
                    onChange={(e) => setRestPassword(e.target.value)}
                    placeholder={
                      settings.hasRestPassword
                        ? '•••••• (اتركها فارغة للإبقاء)'
                        : 'كلمة المرور'
                    }
                    disabled={!canUpdate}
                    autoComplete="new-password"
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  عنوان البوابة البعيدة
                  <input
                    type="url"
                    value={settings.remoteUrl ?? ''}
                    onChange={(e) => patch('remoteUrl', e.target.value)}
                    placeholder="https://auth.example.com/login.php"
                    disabled={!canUpdate}
                    required={!!settings.enabled}
                  />
                </label>
                <label>
                  طريقة الإرسال
                  <select
                    value={settings.httpMethod === 'get' ? 'get' : 'post'}
                    onChange={(e) =>
                      patch('httpMethod', e.target.value as 'post' | 'get')
                    }
                    disabled={!canUpdate}
                  >
                    <option value="post">POST</option>
                    <option value="get">GET</option>
                  </select>
                </label>
                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <legend className="muted" style={{ marginBottom: 8 }}>
                    الحقول المُرسلة
                  </legend>
                  {(
                    [
                      ['sendMac', 'mac'],
                      ['sendIp', 'ip'],
                      ['sendUsername', 'username'],
                      ['sendLinkLogin', 'link-login'],
                      ['sendLinkOrig', 'link-orig'],
                      ['sendError', 'error'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="check-row">
                      <input
                        type="checkbox"
                        checked={!!settings[key]}
                        onChange={(e) => patch(key, e.target.checked)}
                        disabled={!canUpdate}
                      />
                      {label}
                    </label>
                  ))}
                </fieldset>
              </>
            )}

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
