'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  getViewingPageSettings,
  updateViewingPageSettings,
} from '@/features/live/client_live/api';
import type { ViewingPageSettings } from '@/features/live/client_live/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  CardEnableToggle,
  TaskCard,
  notifyMutation,
  useToast,
} from '@/shared/ui';

const EMPTY: ViewingPageSettings = {
  enabled: true,
  brandTitle: '',
  pageTitle: '',
  tagline: '',
};

/** بطاقة إعدادات صفحة بث العميل */
export function ViewingPageSettingsCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.LIVE_VIEWING_PAGE_READ);
  const canUpdate = can(PERMISSIONS.LIVE_VIEWING_PAGE_UPDATE);
  const canToggle = can(PERMISSIONS.LIVE_VIEWING_PAGE_TOGGLE);
  const toast = useToast();
  const [form, setForm] = useState<ViewingPageSettings>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const next = await getViewingPageSettings();
      setForm(next);
      setLoaded(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب الإعدادات');
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
  }, [canRead, reload]);

  const saveTexts = async () => {
    if (!canUpdate) return;
    setBusy(true);
    try {
      const next = await notifyMutation(
        toast,
        () =>
          updateViewingPageSettings({
            brandTitle: form.brandTitle.trim(),
            pageTitle: form.pageTitle.trim(),
            tagline: form.tagline.trim(),
          }),
        { success: 'تم حفظ صفحة المشاهدة' },
      );
      setForm(next);
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  };

  const toggleEnabled = async () => {
    if (!canToggle || busy) return;
    const nextEnabled = !form.enabled;
    setBusy(true);
    try {
      const next = await notifyMutation(
        toast,
        () => updateViewingPageSettings({ enabled: nextEnabled }),
        {
          success: nextEnabled
            ? 'تم تفعيل الصفحة العامة'
            : 'تم إيقاف الصفحة العامة',
        },
      );
      setForm(next);
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  };

  if (!canRead) return null;

  return (
    <TaskCard
      title="إعدادات صفحة المشاهدة"
      actions={
        <>
          <a
            className="btn secondary"
            href="/client-live"
            target="_blank"
            rel="noreferrer"
          >
            فتح الصفحة
          </a>
          {canUpdate ? (
            <button
              className="btn"
              type="button"
              disabled={busy || !loaded}
              onClick={() => void saveTexts()}
            >
              حفظ
            </button>
          ) : null}
        </>
      }
    >
      {error ? <p className="error">{error}</p> : null}
      {!loaded && !error ? <p className="muted">جاري التحميل…</p> : null}
      {loaded ? (
        <div className="form">
          <div className="field-row">
            <span>تفعيل الصفحة العامة</span>
            {canToggle ? (
              <CardEnableToggle
                enabled={form.enabled}
                busy={busy}
                onToggle={() => void toggleEnabled()}
              />
            ) : (
              <span className="muted">
                {form.enabled ? 'مفعّلة' : 'متوقفة'}
              </span>
            )}
          </div>

          <label>
            اسم العلامة
            <input
              value={form.brandTitle}
              disabled={!canUpdate || busy}
              maxLength={80}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, brandTitle: e.target.value }))
              }
            />
          </label>

          <label>
            عنوان الصفحة
            <input
              value={form.pageTitle}
              disabled={!canUpdate || busy}
              maxLength={120}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, pageTitle: e.target.value }))
              }
            />
          </label>

          <label>
            الجملة التعريفية
            <input
              value={form.tagline}
              disabled={!canUpdate || busy}
              maxLength={200}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tagline: e.target.value }))
              }
            />
          </label>

          {!canUpdate && !canToggle ? (
            <p className="muted">عرض فقط — لا صلاحية تعديل</p>
          ) : null}
        </div>
      ) : null}
    </TaskCard>
  );
}
