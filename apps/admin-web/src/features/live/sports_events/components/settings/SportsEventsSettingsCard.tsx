'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  getSportsEventsSettings,
  updateSportsEventsSettings,
} from '@/features/live/sports_events/api';
import type {
  SportsEventsAutoClearMode,
  SportsEventsSettings,
} from '@/features/live/sports_events/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  CardEnableToggle,
  TaskCard,
  notifyMutation,
  useToast,
} from '@/shared/ui';

const EMPTY: SportsEventsSettings = {
  enabled: true,
  title: '',
  timezone: 'Asia/Baghdad',
  autoClearEnabled: false,
  autoClearMode: 'after_hours',
  autoClearAfterHours: 6,
};

export function SportsEventsSettingsCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.LIVE_SPORTS_EVENTS_READ);
  const canUpdate = can(PERMISSIONS.LIVE_SPORTS_EVENTS_UPDATE);
  const toast = useToast();
  const [form, setForm] = useState<SportsEventsSettings>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      setForm(await getSportsEventsSettings());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب الإعدادات');
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
  }, [canRead, reload]);

  async function save() {
    if (!canUpdate) return;
    setBusy(true);
    try {
      const next = await notifyMutation(
        toast,
        () =>
          updateSportsEventsSettings({
            title: form.title.trim(),
            timezone: form.timezone.trim(),
            autoClearEnabled: form.autoClearEnabled,
            autoClearMode: form.autoClearMode,
            autoClearAfterHours: form.autoClearAfterHours,
          }),
        { success: 'تم حفظ ضبط الأحداث الرياضية' },
      );
      setForm(next);
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  async function toggleEnabled() {
    if (!canUpdate || busy) return;
    const nextEnabled = !form.enabled;
    setBusy(true);
    try {
      const next = await notifyMutation(
        toast,
        () => updateSportsEventsSettings({ enabled: nextEnabled }),
        {
          success: nextEnabled
            ? 'تم تفعيل الأحداث الرياضية'
            : 'تم إيقاف الأحداث الرياضية',
        },
      );
      setForm(next);
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  function setAutoClearMode(mode: SportsEventsAutoClearMode) {
    setForm((prev) => ({ ...prev, autoClearMode: mode }));
  }

  if (!canRead) return null;

  return (
    <TaskCard
      title="ضبط الأحداث الرياضية"
      actions={
        canUpdate ? (
          <CardEnableToggle
            enabled={form.enabled}
            busy={busy}
            onToggle={() => void toggleEnabled()}
          />
        ) : null
      }
    >
      {error ? <p className="error">{error}</p> : null}
      <div className="form">
        <label>
          عنوان القسم
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            disabled={!canUpdate || busy}
          />
        </label>
        <label>
          المنطقة الزمنية (أحداث اليوم)
          <input
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            disabled={!canUpdate || busy}
            placeholder="Asia/Baghdad"
          />
        </label>

        <fieldset
          disabled={!canUpdate || busy}
          style={{
            border: '1px solid var(--border, #333)',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            margin: 0,
          }}
        >
          <legend style={{ paddingInline: '0.35rem' }}>
            جدول مسح أحداث اليوم
          </legend>

          <label className="check-row" style={{ marginBottom: '0.75rem' }}>
            <input
              type="checkbox"
              checked={form.autoClearEnabled}
              onChange={(e) =>
                setForm({ ...form, autoClearEnabled: e.target.checked })
              }
            />
            تفعيل المسح التلقائي
          </label>

          <p className="muted" style={{ marginTop: 0 }}>
            عند التعطيل لن يُحذف أي محتوى تلقائياً.
          </p>

          <div
            style={{
              opacity: form.autoClearEnabled ? 1 : 0.5,
              pointerEvents: form.autoClearEnabled ? 'auto' : 'none',
              display: 'grid',
              gap: '0.65rem',
            }}
          >
            <label className="check-row">
              <input
                type="radio"
                name="autoClearMode"
                checked={form.autoClearMode === 'all'}
                onChange={() => setAutoClearMode('all')}
              />
              حذف الكل (مسح كل المباريات كل فترة)
            </label>
            <label className="check-row">
              <input
                type="radio"
                name="autoClearMode"
                checked={form.autoClearMode === 'after_hours'}
                onChange={() => setAutoClearMode('after_hours')}
              />
              بعد مرور ساعات على موعد المباراة
            </label>
            <label>
              عدد الساعات
              <input
                type="number"
                min={1}
                max={168}
                value={form.autoClearAfterHours}
                onChange={(e) =>
                  setForm({
                    ...form,
                    autoClearAfterHours: Number(e.target.value) || 1,
                  })
                }
              />
            </label>
            <p className="muted" style={{ margin: 0 }}>
              {form.autoClearMode === 'all'
                ? 'يُمسح جدول أحداث اليوم بالكامل كل عدد الساعات المحدد.'
                : 'تُحذف كل مباراة بعد مرور عدد الساعات المحدد على موعدها.'}{' '}
              يُراجع الجدول كل بضع دقائق.
            </p>
          </div>
        </fieldset>

        {canUpdate ? (
          <button
            className="btn"
            type="button"
            disabled={busy}
            onClick={() => void save()}
          >
            حفظ
          </button>
        ) : null}
      </div>
    </TaskCard>
  );
}
