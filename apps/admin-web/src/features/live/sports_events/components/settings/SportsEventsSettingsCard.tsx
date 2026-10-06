'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  getSportsEventsSettings,
  syncExternalMatches,
  updateSportsEventsSettings,
} from '@/features/live/sports_events/api';
import type {
  SportsEventsAutoClearMode,
  SportsEventsSettings,
} from '@/features/live/sports_events/types';
import { DEFAULT_EXTERNAL_MATCHES_URL } from '@/features/live/sports_events/types';
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
  externalSyncEnabled: false,
  externalSyncUrl: DEFAULT_EXTERNAL_MATCHES_URL,
  externalSyncGeneralEnabled: true,
  externalSyncGeneralIntervalMinutes: 5,
  externalSyncGeneralIntervalSeconds: 0,
  lastExternalSyncGeneralAt: null,
  externalSyncLiveEnabled: false,
  externalSyncLiveIntervalMinutes: 0,
  externalSyncLiveIntervalSeconds: 30,
  lastExternalSyncLiveAt: null,
  lastExternalSyncAt: null,
};

function formatSyncAt(value: string | null | undefined) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('ar', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function IntervalFields({
  minutes,
  seconds,
  disabled,
  onMinutes,
  onSeconds,
}: {
  minutes: number;
  seconds: number;
  disabled?: boolean;
  onMinutes: (value: number) => void;
  onSeconds: (value: number) => void;
}) {
  return (
    <div className="sports-interval-fields">
      <label>
        دقائق
        <input
          type="number"
          min={0}
          max={180}
          value={minutes}
          disabled={disabled}
          onChange={(e) => onMinutes(Number(e.target.value) || 0)}
        />
      </label>
      <label>
        ثوانٍ
        <input
          type="number"
          min={0}
          max={59}
          value={seconds}
          disabled={disabled}
          onChange={(e) => onSeconds(Number(e.target.value) || 0)}
        />
      </label>
    </div>
  );
}

export function SportsEventsSettingsCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.LIVE_SPORTS_EVENTS_READ);
  const canUpdate = can(PERMISSIONS.LIVE_SPORTS_EVENTS_UPDATE);
  const toast = useToast();
  const [form, setForm] = useState<SportsEventsSettings>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);

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
            externalSyncEnabled: form.externalSyncEnabled,
            externalSyncUrl: form.externalSyncUrl.trim(),
            externalSyncGeneralEnabled: form.externalSyncGeneralEnabled,
            externalSyncGeneralIntervalMinutes:
              form.externalSyncGeneralIntervalMinutes,
            externalSyncGeneralIntervalSeconds:
              form.externalSyncGeneralIntervalSeconds,
            externalSyncLiveEnabled: form.externalSyncLiveEnabled,
            externalSyncLiveIntervalMinutes:
              form.externalSyncLiveIntervalMinutes,
            externalSyncLiveIntervalSeconds:
              form.externalSyncLiveIntervalSeconds,
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

  async function onSyncNow() {
    if (!canUpdate || !form.externalSyncEnabled) return;
    setSyncing(true);
    try {
      const result = await notifyMutation(toast, () => syncExternalMatches(), {
        success: 'تمت مزامنة المباريات من المصدر',
        error: 'تعذرت المزامنة',
      });
      toast.info(
        `جلب ${result.fetched} · جديد ${result.created} · تحديث ${result.updated}` +
          (result.unmatchedChannels.length
            ? ` · قنوات غير مربوطة: ${result.unmatchedChannels.join('، ')}`
            : ''),
      );
      await reload();
    } catch {
      /* toast */
    } finally {
      setSyncing(false);
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
          المنطقة الزمنية
          <input
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            disabled={!canUpdate || busy}
            placeholder="Asia/Baghdad"
          />
        </label>

        <fieldset
          disabled={!canUpdate || busy}
          className="sports-settings-fieldset"
        >
          <legend>مزامنة المباريات من مصدر خارجي</legend>

          <label className="check-row" style={{ marginBottom: '0.75rem' }}>
            <input
              type="checkbox"
              checked={form.externalSyncEnabled}
              onChange={(e) =>
                setForm({ ...form, externalSyncEnabled: e.target.checked })
              }
            />
            تفعيل المزامنة من المصدر
          </label>

          <div
            className="sports-sync-fields"
            style={{
              opacity: form.externalSyncEnabled ? 1 : 0.5,
              pointerEvents: form.externalSyncEnabled ? 'auto' : 'none',
            }}
          >
            <label>
              رابط المصدر
              <input
                value={form.externalSyncUrl}
                onChange={(e) =>
                  setForm({ ...form, externalSyncUrl: e.target.value })
                }
                placeholder={DEFAULT_EXTERNAL_MATCHES_URL}
                dir="ltr"
              />
            </label>

            <div className="sports-sync-mode">
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={form.externalSyncGeneralEnabled}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      externalSyncGeneralEnabled: e.target.checked,
                    })
                  }
                />
                مزامنة عامة
              </label>
              <p className="muted" style={{ margin: 0 }}>
                تعمل بشكل دوري دائماً طالما كانت مفعّلة.
              </p>
              <IntervalFields
                minutes={form.externalSyncGeneralIntervalMinutes}
                seconds={form.externalSyncGeneralIntervalSeconds}
                disabled={!form.externalSyncGeneralEnabled}
                onMinutes={(value) =>
                  setForm({
                    ...form,
                    externalSyncGeneralIntervalMinutes: value,
                  })
                }
                onSeconds={(value) =>
                  setForm({
                    ...form,
                    externalSyncGeneralIntervalSeconds: value,
                  })
                }
              />
              <p className="muted" style={{ margin: 0 }}>
                آخر مزامنة عامة: {formatSyncAt(form.lastExternalSyncGeneralAt)}
              </p>
            </div>

            <div className="sports-sync-mode">
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={form.externalSyncLiveEnabled}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      externalSyncLiveEnabled: e.target.checked,
                    })
                  }
                />
                مزامنة المباريات الجارية
              </label>
              <p className="muted" style={{ margin: 0 }}>
                تعمل فقط عند وجود مباراة بدأت ولم تُعلَم منتهية بعد.
              </p>
              <IntervalFields
                minutes={form.externalSyncLiveIntervalMinutes}
                seconds={form.externalSyncLiveIntervalSeconds}
                disabled={!form.externalSyncLiveEnabled}
                onMinutes={(value) =>
                  setForm({
                    ...form,
                    externalSyncLiveIntervalMinutes: value,
                  })
                }
                onSeconds={(value) =>
                  setForm({
                    ...form,
                    externalSyncLiveIntervalSeconds: value,
                  })
                }
              />
              <p className="muted" style={{ margin: 0 }}>
                آخر مزامنة جارية: {formatSyncAt(form.lastExternalSyncLiveAt)}
              </p>
            </div>

            <p className="muted" style={{ margin: 0 }}>
              آخر مزامنة: {formatSyncAt(form.lastExternalSyncAt)}
            </p>
            {canUpdate ? (
              <button
                type="button"
                className="btn secondary"
                disabled={busy || syncing || !form.externalSyncEnabled}
                onClick={() => void onSyncNow()}
              >
                {syncing ? 'جارٍ المزامنة…' : 'مزامنة الآن'}
              </button>
            ) : null}
          </div>
        </fieldset>

        <fieldset
          disabled={!canUpdate || busy}
          className="sports-settings-fieldset"
        >
          <legend>جدول مسح المباريات</legend>

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
