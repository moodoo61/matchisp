'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PERMISSIONS } from '@isp/shared';
import {
  getViewingPageSettings,
  updateViewingPageSettings,
} from '@/features/live/client_live/api';
import type { ViewingPageSettings } from '@/features/live/client_live/types';
import { ViewingReportsEnableRow } from '@/features/live/viewing_reports/components/ViewingReportsEnableRow';
import { usePermissions } from '@/lib/usePermissions';
import {
  CardEnableToggle,
  IconButton,
  IconEdit,
  IconEye,
  IconSave,
  TaskCard,
  notifyMutation,
  useToast,
} from '@/shared/ui';

const EMPTY: ViewingPageSettings = {
  enabled: true,
  brandTitle: '',
  brandLogoUrl: '',
  brandLogoAbsoluteUrl: null,
  showBrandTitle: true,
  showBrandLogo: true,
  brandSubtitle: 'LIVE • HD',
  showBrandSubtitle: true,
  liveBadgeText: 'بث مباشر',
  showLiveBadge: true,
  pageTitle: '',
  tagline: '',
  showMatchSchedule: true,
  autoplayOnEnter: false,
  jwtPlaybackEnabled: false,
  playerTsEnabled: true,
  playerHlsEnabled: true,
};

type VisibilityKey =
  | 'showBrandTitle'
  | 'showBrandLogo'
  | 'showBrandSubtitle'
  | 'showLiveBadge'
  | 'showMatchSchedule'
  | 'autoplayOnEnter'
  | 'jwtPlaybackEnabled'
  | 'playerTsEnabled'
  | 'playerHlsEnabled';

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
  const [busyKey, setBusyKey] = useState<VisibilityKey | null>(null);

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

  const togglePageEnabled = async () => {
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

  const toggleVisibility = async (
    key: VisibilityKey,
    labels: [string, string],
  ) => {
    if (!canUpdate || busy) return;
    const nextValue = !form[key];
    setBusy(true);
    setBusyKey(key);
    try {
      const next = await notifyMutation(
        toast,
        () => updateViewingPageSettings({ [key]: nextValue }),
        {
          success: nextValue ? labels[0] : labels[1],
        },
      );
      setForm(next);
    } catch {
      /* toast */
    } finally {
      setBusy(false);
      setBusyKey(null);
    }
  };

  const saveTexts = async () => {
    if (!canUpdate || busy) return;
    setBusy(true);
    try {
      const next = await notifyMutation(
        toast,
        () =>
          updateViewingPageSettings({
            brandSubtitle: form.brandSubtitle.trim(),
            liveBadgeText: form.liveBadgeText.trim(),
          }),
        { success: 'تم حفظ عبارات الترويسة' },
      );
      setForm(next);
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  };

  if (!canRead) return null;

  const brandLogoSrc =
    form.brandLogoAbsoluteUrl || form.brandLogoUrl || null;

  return (
    <TaskCard
      title="إعدادات"
      footer={
        canUpdate ? (
          <IconButton
            label="حفظ"
            tone="accent"
            disabled={busy || !loaded}
            onClick={() => void saveTexts()}
          >
            <IconSave />
          </IconButton>
        ) : null
      }
    >
      {error ? <p className="error">{error}</p> : null}
      {!loaded && !error ? <p className="muted">جاري التحميل…</p> : null}
      {loaded ? (
        <div className="viewing-settings-form">
          <div className="viewing-settings-row">
            <span className="viewing-settings-label">صفحة البث المباشر</span>
            <span className="viewing-settings-meta">
              {form.enabled ? 'مفعّلة' : 'متوقفة'}
            </span>
            <div className="viewing-settings-actions">
              <a
                className="icon-btn tone-default viewing-preview-link"
                href="/client-live"
                target="_blank"
                rel="noreferrer"
                title="معاينة"
                aria-label="معاينة"
              >
                <span>معاينة</span>
                <IconEye />
              </a>
              {canToggle ? (
                <CardEnableToggle
                  enabled={form.enabled}
                  busy={busy && busyKey === null}
                  onToggle={() => void togglePageEnabled()}
                />
              ) : (
                <span className="muted">
                  {form.enabled ? 'مفعّلة' : 'متوقفة'}
                </span>
              )}
            </div>
          </div>

          <div className="viewing-settings-row">
            <span className="viewing-settings-label">اسم العلامة</span>
            <span className="viewing-settings-meta viewing-settings-value">
              {form.brandTitle.trim() || '—'}
            </span>
            <div className="viewing-settings-actions">
              <Link
                href="/settings/general"
                className="icon-btn tone-default"
                title="تعديل من الإعدادات العامة"
                aria-label="تعديل اسم العلامة من الإعدادات العامة"
              >
                <IconEdit />
              </Link>
              {canUpdate ? (
                <CardEnableToggle
                  enabled={form.showBrandTitle}
                  busy={busyKey === 'showBrandTitle'}
                  onToggle={() =>
                    void toggleVisibility('showBrandTitle', [
                      'تم إظهار اسم العلامة',
                      'تم إخفاء اسم العلامة',
                    ])
                  }
                />
              ) : (
                <span className="muted">
                  {form.showBrandTitle ? 'ظاهر' : 'مخفي'}
                </span>
              )}
            </div>
          </div>

          <div className="viewing-settings-row">
            <span className="viewing-settings-label">شعار العلامة</span>
            <span className="viewing-settings-meta">
              {brandLogoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="viewing-settings-logo"
                  src={brandLogoSrc}
                  alt=""
                />
              ) : (
                <span className="muted">—</span>
              )}
            </span>
            <div className="viewing-settings-actions">
              <Link
                href="/settings/general"
                className="icon-btn tone-default"
                title="تعديل من الإعدادات العامة"
                aria-label="تعديل شعار العلامة من الإعدادات العامة"
              >
                <IconEdit />
              </Link>
              {canUpdate ? (
                <CardEnableToggle
                  enabled={form.showBrandLogo}
                  busy={busyKey === 'showBrandLogo'}
                  onToggle={() =>
                    void toggleVisibility('showBrandLogo', [
                      'تم إظهار شعار العلامة',
                      'تم إخفاء شعار العلامة',
                    ])
                  }
                />
              ) : (
                <span className="muted">
                  {form.showBrandLogo ? 'ظاهر' : 'مخفي'}
                </span>
              )}
            </div>
          </div>

          <div className="viewing-settings-row">
            <span className="viewing-settings-label">عبارة الترويسة</span>
            <span className="viewing-settings-meta">
              <input
                className="viewing-settings-input"
                value={form.brandSubtitle}
                disabled={!canUpdate || busy}
                maxLength={80}
                placeholder="LIVE • HD"
                dir="ltr"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    brandSubtitle: e.target.value,
                  }))
                }
              />
            </span>
            <div className="viewing-settings-actions">
              {canUpdate ? (
                <CardEnableToggle
                  enabled={form.showBrandSubtitle}
                  busy={busyKey === 'showBrandSubtitle'}
                  onToggle={() =>
                    void toggleVisibility('showBrandSubtitle', [
                      'تم إظهار عبارة الترويسة',
                      'تم إخفاء عبارة الترويسة',
                    ])
                  }
                />
              ) : (
                <span className="muted">
                  {form.showBrandSubtitle ? 'ظاهر' : 'مخفي'}
                </span>
              )}
            </div>
          </div>

          <div className="viewing-settings-row">
            <span className="viewing-settings-label">شارة البث</span>
            <span className="viewing-settings-meta">
              <input
                className="viewing-settings-input"
                value={form.liveBadgeText}
                disabled={!canUpdate || busy}
                maxLength={40}
                placeholder="بث مباشر"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    liveBadgeText: e.target.value,
                  }))
                }
              />
            </span>
            <div className="viewing-settings-actions">
              {canUpdate ? (
                <CardEnableToggle
                  enabled={form.showLiveBadge}
                  busy={busyKey === 'showLiveBadge'}
                  onToggle={() =>
                    void toggleVisibility('showLiveBadge', [
                      'تم إظهار شارة البث',
                      'تم إخفاء شارة البث',
                    ])
                  }
                />
              ) : (
                <span className="muted">
                  {form.showLiveBadge ? 'ظاهر' : 'مخفي'}
                </span>
              )}
            </div>
          </div>

          <div className="viewing-settings-row">
            <span className="viewing-settings-label">جدول المباريات</span>
            <span className="viewing-settings-meta">
              {form.showMatchSchedule ? 'ظاهر' : 'مخفي'}
            </span>
            <div className="viewing-settings-actions">
              {canUpdate ? (
                <CardEnableToggle
                  enabled={form.showMatchSchedule}
                  busy={busyKey === 'showMatchSchedule'}
                  onToggle={() =>
                    void toggleVisibility('showMatchSchedule', [
                      'تم إظهار جدول المباريات',
                      'تم إخفاء جدول المباريات',
                    ])
                  }
                />
              ) : (
                <span className="muted">
                  {form.showMatchSchedule ? 'ظاهر' : 'مخفي'}
                </span>
              )}
            </div>
          </div>

          <div className="viewing-settings-row">
            <span className="viewing-settings-label">التشغيل التلقائي</span>
            <span className="viewing-settings-meta">
              {form.autoplayOnEnter
                ? 'خيار إضافي: يشتغل عند دخول الصفحة'
                : 'الافتراضي: يحتاج ضغط تشغيل'}
            </span>
            <div className="viewing-settings-actions">
              {canUpdate ? (
                <CardEnableToggle
                  enabled={form.autoplayOnEnter}
                  busy={busyKey === 'autoplayOnEnter'}
                  onToggle={() =>
                    void toggleVisibility('autoplayOnEnter', [
                      'تم السماح بالتشغيل التلقائي',
                      'تم منع التشغيل التلقائي',
                    ])
                  }
                />
              ) : (
                <span className="muted">
                  {form.autoplayOnEnter ? 'مسموح' : 'ممنوع'}
                </span>
              )}
            </div>
          </div>

          <div className="viewing-settings-row">
            <span className="viewing-settings-label">حماية روابط المشاهدة</span>
            <span className="viewing-settings-meta">
              {form.jwtPlaybackEnabled
                ? 'JWK + USER_NEW على قنوات اللوحة'
                : 'روابط مفتوحة بدون توكن'}
            </span>
            <div className="viewing-settings-actions">
              {canUpdate ? (
                <CardEnableToggle
                  enabled={form.jwtPlaybackEnabled}
                  busy={busyKey === 'jwtPlaybackEnabled'}
                  onToggle={() =>
                    void toggleVisibility('jwtPlaybackEnabled', [
                      'تم تفعيل حماية روابط المشاهدة',
                      'تم تعطيل حماية روابط المشاهدة',
                    ])
                  }
                />
              ) : (
                <span className="muted">
                  {form.jwtPlaybackEnabled ? 'مفعّل' : 'معطّل'}
                </span>
              )}
            </div>
          </div>

          <div className="viewing-settings-row">
            <span className="viewing-settings-label">مشغّل TS</span>
            <span className="viewing-settings-meta">
              {form.playerTsEnabled
                ? 'الخيار الأول في صفحة العميل'
                : 'مخفي عن العميل'}
            </span>
            <div className="viewing-settings-actions">
              {canUpdate ? (
                <CardEnableToggle
                  enabled={form.playerTsEnabled}
                  busy={busyKey === 'playerTsEnabled'}
                  onToggle={() =>
                    void toggleVisibility('playerTsEnabled', [
                      'تم تفعيل مشغّل TS',
                      'تم تعطيل مشغّل TS',
                    ])
                  }
                />
              ) : (
                <span className="muted">
                  {form.playerTsEnabled ? 'مفعّل' : 'معطّل'}
                </span>
              )}
            </div>
          </div>

          <div className="viewing-settings-row">
            <span className="viewing-settings-label">مشغّل HLS</span>
            <span className="viewing-settings-meta">
              {form.playerHlsEnabled
                ? 'الخيار الثاني في صفحة العميل'
                : 'مخفي عن العميل'}
            </span>
            <div className="viewing-settings-actions">
              {canUpdate ? (
                <CardEnableToggle
                  enabled={form.playerHlsEnabled}
                  busy={busyKey === 'playerHlsEnabled'}
                  onToggle={() =>
                    void toggleVisibility('playerHlsEnabled', [
                      'تم تفعيل مشغّل HLS',
                      'تم تعطيل مشغّل HLS',
                    ])
                  }
                />
              ) : (
                <span className="muted">
                  {form.playerHlsEnabled ? 'مفعّل' : 'معطّل'}
                </span>
              )}
            </div>
          </div>

          <ViewingReportsEnableRow />

          {!canUpdate && !canToggle ? (
            <p className="muted">عرض فقط — لا صلاحية تعديل</p>
          ) : null}
        </div>
      ) : null}
    </TaskCard>
  );
}
