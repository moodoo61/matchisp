'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  PUBLIC_LOGIN_ENDPOINTS,
  getLoginBrand,
  updateLoginBrand,
  uploadLoginBrandFile,
} from '@/features/page_management/api';
import type { LoginBrandSettings } from '@/features/page_management/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  CopyApiIcon,
  ImageUploadField,
  TaskCard,
  notifyMutation,
  useToast,
} from '@/shared/ui';

/** بطاقة العلامة — أول خيارات صفحة الدخول العامة */
export function LoginBrandCard() {
  const toast = useToast();
  const [settings, setSettings] = useState<LoginBrandSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PAGE_LOGIN_BRAND_READ);
  const canUpdate = can(PERMISSIONS.PAGE_LOGIN_BRAND_UPDATE);

  async function reload() {
    try {
      setSettings(await getLoginBrand());
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
          updateLoginBrand({
            useCustom: settings.useCustom,
            name: settings.name,
            logoUrl: settings.logoUrl,
          }),
        { success: 'تم حفظ إعدادات العلامة' },
      );
      await reload();
    } catch {
      // notifyMutation
    } finally {
      setBusy(false);
    }
  }

  function patch<K extends keyof LoginBrandSettings>(
    key: K,
    value: LoginBrandSettings[K],
  ) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  const previewName = settings?.resolved.name || '—';
  const previewLogo =
    settings?.resolved.logoUrl ||
    settings?.general.brandLogoAbsoluteUrl ||
    '';

  return (
    <>
      {error ? <div className="error">{error}</div> : null}
      <TaskCard
        title="العلامة"
        actions={<CopyApiIcon path={PUBLIC_LOGIN_ENDPOINTS.brand} />}
      >
        <p className="muted" style={{ marginBottom: 12 }}>
          الاسم والشعار يظهران في صفحة تسجيل الدخول على الراوتر. الافتراضي من{' '}
          <Link href="/settings/general">إعدادات العلامة</Link>، مع إمكانية
          تخصيص مختلف لهذه الصفحة فقط.
        </p>

        {!settings ? (
          <p className="muted">جاري التحميل…</p>
        ) : (
          <form className="form" onSubmit={submit}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 12,
              }}
            >
              {previewLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewLogo}
                  alt=""
                  className="table-thumb"
                  style={{ width: 48, height: 48, objectFit: 'contain' }}
                />
              ) : (
                <span className="muted">لا يوجد شعار</span>
              )}
              <div>
                <strong>{previewName}</strong>
                <div className="muted" style={{ fontSize: 12 }}>
                  {settings.resolved.source === 'custom'
                    ? 'تخصيص صفحة الدخول'
                    : 'من الإعدادات العامة'}
                </div>
              </div>
            </div>

            <label className="check-row">
              <input
                type="checkbox"
                checked={settings.useCustom}
                onChange={(e) => patch('useCustom', e.target.checked)}
                disabled={!canUpdate}
              />
              تخصيص مختلف لصفحة تسجيل الدخول
            </label>

            {!settings.useCustom ? (
              <p className="muted" style={{ marginTop: 8 }}>
                يُستخدم اسم العلامة وشعارها من الإعدادات العامة. عدّلهما من{' '}
                <Link href="/settings/general">الإعدادات ← عامة</Link>.
              </p>
            ) : (
              <>
                <label>
                  اسم العلامة
                  <input
                    value={settings.name}
                    onChange={(e) => patch('name', e.target.value)}
                    maxLength={120}
                    placeholder={
                      settings.general.brandName || 'اسم يظهر على الصفحة'
                    }
                    disabled={!canUpdate}
                  />
                </label>
                <label>
                  شعار العلامة
                  <ImageUploadField
                    value={settings.logoUrl}
                    onChange={(url) => patch('logoUrl', url)}
                    required={false}
                    onUpload={async (file) => {
                      const res = await uploadLoginBrandFile(file);
                      return res.logoUrl;
                    }}
                  />
                </label>
                <p className="muted" style={{ fontSize: 12 }}>
                  إن تُرك الاسم أو الشعار فارغاً يُكمَل من الإعدادات العامة.
                </p>
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
