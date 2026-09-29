'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  getGeneralSettings,
  updateGeneralSettings,
  uploadGeneralBrandLogo,
  uploadGeneralLogo,
} from '@/features/settings/general/api';
import { CompactLogoUpload } from '@/features/settings/general/components/CompactLogoUpload';
import type { GeneralSettings } from '@/features/settings/general/types';
import { usePermissions } from '@/lib/usePermissions';
import { TaskCard, notifyMutation, useToast } from '@/shared/ui';

export function GeneralSettingsCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.SETTINGS_GENERAL_READ);
  const canManage = can(PERMISSIONS.SETTINGS_GENERAL_MANAGE);
  const toast = useToast();

  const [data, setData] = useState<GeneralSettings | null>(null);
  const [systemName, setSystemName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      const row = await getGeneralSettings();
      setData(row);
      setSystemName(row.systemName);
      setLogoUrl(row.logoUrl);
      setBrandName(row.brandName);
      setBrandLogoUrl(row.brandLogoUrl);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب الإعدادات العامة');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
  }, [canRead, reload]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    await notifyMutation(
      toast,
      () =>
        updateGeneralSettings({
          systemName: systemName.trim(),
          logoUrl: logoUrl.trim(),
          brandName: brandName.trim(),
          brandLogoUrl: brandLogoUrl.trim(),
        }),
      {
        success: 'تم حفظ الإعدادات العامة',
        error: 'تعذر حفظ الإعدادات',
      },
    );
    await reload();
  }

  if (!canRead) return null;

  return (
    <TaskCard title="بيانات">
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p className="muted">جاري التحميل…</p> : null}
      {data ? (
        <form className="form general-settings-form" onSubmit={onSubmit}>
          <div className="general-settings-row">
            <label>
              اسم النظام
              <input
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                minLength={2}
                maxLength={120}
                required
                disabled={!canManage || busy}
              />
            </label>
            <label>
              الشعار
              {canManage ? (
                <CompactLogoUpload
                  value={logoUrl}
                  previewUrl={data.logoAbsoluteUrl || logoUrl}
                  disabled={busy}
                  onUploaded={(url) => {
                    setLogoUrl(url);
                    setData((prev) =>
                      prev ? { ...prev, logoUrl: url, logoAbsoluteUrl: url } : prev,
                    );
                  }}
                  onUpload={uploadGeneralLogo}
                />
              ) : logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.logoAbsoluteUrl || logoUrl}
                  alt="شعار النظام"
                  className="general-logo-thumb"
                />
              ) : (
                <p className="muted">لا يوجد شعار</p>
              )}
            </label>
          </div>

          <div className="general-settings-row">
            <label>
              اسم العلامة
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                maxLength={120}
                disabled={!canManage || busy}
              />
            </label>
            <label>
              شعار العلامة
              {canManage ? (
                <CompactLogoUpload
                  value={brandLogoUrl}
                  previewUrl={data.brandLogoAbsoluteUrl || brandLogoUrl}
                  disabled={busy}
                  onUploaded={(url) => {
                    setBrandLogoUrl(url);
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            brandLogoUrl: url,
                            brandLogoAbsoluteUrl: url,
                          }
                        : prev,
                    );
                  }}
                  onUpload={uploadGeneralBrandLogo}
                />
              ) : brandLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.brandLogoAbsoluteUrl || brandLogoUrl}
                  alt="شعار العلامة"
                  className="general-logo-thumb"
                />
              ) : (
                <p className="muted">لا يوجد شعار</p>
              )}
            </label>
          </div>

          {canManage ? (
            <div className="general-settings-actions">
              <button className="btn" type="submit" disabled={busy}>
                حفظ
              </button>
            </div>
          ) : null}
        </form>
      ) : null}
    </TaskCard>
  );
}
