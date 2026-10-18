'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  PUBLIC_MORE_PAGE_PATH,
  getMorePageSettings,
  updateMorePageSettings,
} from '@/features/page_management/api';
import { useCardFlag } from '@/features/page_management/hooks/useCardFlag';
import type { MorePageSettings } from '@/features/page_management/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  CardEnableToggle,
  CopyApiIcon,
  TaskCard,
  notifyMutation,
  useToast,
} from '@/shared/ui';

/** بطاقة إعدادات صفحة المزيد + تفعيل الصفحة */
export function MorePageSettingsCard() {
  const toast = useToast();
  const [settings, setSettings] = useState<MorePageSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const flag = useCardFlag('more_page');
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PAGE_MORE_SETTINGS_READ);
  const canUpdate = can(PERMISSIONS.PAGE_MORE_SETTINGS_UPDATE);
  const canToggle = can(PERMISSIONS.PAGE_MORE_SETTINGS_TOGGLE);

  async function reload() {
    try {
      setSettings(await getMorePageSettings());
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
          updateMorePageSettings({
            heroTitle: settings.heroTitle,
            heroSubtitle: settings.heroSubtitle,
            itemsSectionTitle: settings.itemsSectionTitle,
            itemsSectionSubtitle: settings.itemsSectionSubtitle,
            aboutSectionTitle: settings.aboutSectionTitle,
            aboutSectionSubtitle: settings.aboutSectionSubtitle,
            storySectionTitle: settings.storySectionTitle,
            storySectionSubtitle: settings.storySectionSubtitle,
            footerText: settings.footerText,
          }),
        { success: 'تم حفظ إعدادات الصفحة' },
      );
      await reload();
    } catch {
      // الإشعار عبر notifyMutation
    } finally {
      setBusy(false);
    }
  }

  function patch<K extends keyof MorePageSettings>(
    key: K,
    value: MorePageSettings[K],
  ) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  return (
    <>
      {error || flag.error ? (
        <div className="error">{error || flag.error}</div>
      ) : null}
      <TaskCard
        title="صفحة المزيد"
        enabled={flag.enabled}
        actions={
          <>
            {canToggle ? (
              <CardEnableToggle
                enabled={flag.enabled}
                busy={flag.busy}
                onToggle={flag.toggle}
              />
            ) : null}
            <CopyApiIcon path={PUBLIC_MORE_PAGE_PATH} />
          </>
        }
      >
        {!settings ? (
          <p className="muted">جاري التحميل…</p>
        ) : (
          <form className="form" onSubmit={submit}>
            <label>
              عنوان الواجهة
              <input
                value={settings.heroTitle}
                onChange={(e) => patch('heroTitle', e.target.value)}
                disabled={!canUpdate}
                required
              />
            </label>
            <label>
              العنوان الفرعي
              <input
                value={settings.heroSubtitle}
                onChange={(e) => patch('heroSubtitle', e.target.value)}
                disabled={!canUpdate}
              />
            </label>
            <label>
              عنوان تبويب العناصر
              <input
                value={settings.itemsSectionTitle}
                onChange={(e) => patch('itemsSectionTitle', e.target.value)}
                disabled={!canUpdate}
                required
              />
            </label>
            <label>
              وصف تبويب العناصر
              <input
                value={settings.itemsSectionSubtitle}
                onChange={(e) => patch('itemsSectionSubtitle', e.target.value)}
                disabled={!canUpdate}
              />
            </label>
            <label>
              عنوان من نحن
              <input
                value={settings.aboutSectionTitle}
                onChange={(e) => patch('aboutSectionTitle', e.target.value)}
                disabled={!canUpdate}
                required
              />
            </label>
            <label>
              وصف من نحن
              <input
                value={settings.aboutSectionSubtitle}
                onChange={(e) => patch('aboutSectionSubtitle', e.target.value)}
                disabled={!canUpdate}
              />
            </label>
            <label>
              عنوان القصة
              <input
                value={settings.storySectionTitle}
                onChange={(e) => patch('storySectionTitle', e.target.value)}
                disabled={!canUpdate}
                required
              />
            </label>
            <label>
              وصف القصة
              <input
                value={settings.storySectionSubtitle}
                onChange={(e) => patch('storySectionSubtitle', e.target.value)}
                disabled={!canUpdate}
              />
            </label>
            <label>
              نص التذييل
              <input
                value={settings.footerText}
                onChange={(e) => patch('footerText', e.target.value)}
                disabled={!canUpdate}
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
