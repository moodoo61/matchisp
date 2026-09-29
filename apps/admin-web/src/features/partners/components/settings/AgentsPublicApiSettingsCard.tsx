'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  getAgentsPublicApiSettings,
  updateAgentsPublicApiSettings,
} from '@/features/partners/api';
import type {
  AgentsPublicApiFields,
  AgentsPublicApiSettings,
} from '@/features/partners/types';
import {
  AGENTS_PUBLIC_FIELD_LABELS,
  PUBLIC_AGENTS_ENDPOINT,
} from '@/features/partners/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  CardEnableToggle,
  CopyApiIcon,
  TaskCard,
  notifyMutation,
  useToast,
} from '@/shared/ui';

const EMPTY: AgentsPublicApiSettings = {
  enabled: true,
  fields: {
    name: true,
    region: true,
    address: true,
    shopName: false,
    phone: false,
    order: true,
    latitude: false,
    longitude: false,
  },
};

export function AgentsPublicApiSettingsCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PARTNERS_READ);
  const canUpdate = can(PERMISSIONS.PARTNERS_UPDATE);
  const toast = useToast();
  const [form, setForm] = useState<AgentsPublicApiSettings>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      setForm(await getAgentsPublicApiSettings());
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
          updateAgentsPublicApiSettings({
            enabled: form.enabled,
            fields: form.fields,
          }),
        { success: 'تم حفظ إعدادات API الوكلاء' },
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
        () => updateAgentsPublicApiSettings({ enabled: nextEnabled }),
        {
          success: nextEnabled
            ? 'تم تفعيل نقطة نهاية الوكلاء'
            : 'تم إيقاف نقطة نهاية الوكلاء',
        },
      );
      setForm(next);
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  function setField(key: keyof AgentsPublicApiFields, value: boolean) {
    setForm((prev) => ({
      ...prev,
      fields: { ...prev.fields, [key]: value },
    }));
  }

  if (!canRead) return null;

  return (
    <TaskCard
      title="إعدادات API الوكلاء"
      actions={
        <>
          <CopyApiIcon path={PUBLIC_AGENTS_ENDPOINT} />
          {canUpdate ? (
            <CardEnableToggle
              enabled={form.enabled}
              busy={busy}
              onToggle={() => void toggleEnabled()}
            />
          ) : null}
        </>
      }
    >
      {error ? <p className="error">{error}</p> : null}
      <p className="muted">
        حدّد الحقول التي تُرجعها نقطة النهاية العامة للعميل.
      </p>
      <div className="form">
        <fieldset
          disabled={!canUpdate || busy || !form.enabled}
          style={{
            border: '1px solid var(--border, #333)',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            margin: 0,
            opacity: form.enabled ? 1 : 0.55,
          }}
        >
          <legend style={{ paddingInline: '0.35rem' }}>حقول الاستجابة</legend>
          {(
            Object.keys(AGENTS_PUBLIC_FIELD_LABELS) as (keyof AgentsPublicApiFields)[]
          ).map((key) => (
            <label key={key} className="check-row" style={{ marginBottom: '0.5rem' }}>
              <input
                type="checkbox"
                checked={form.fields[key]}
                onChange={(e) => setField(key, e.target.checked)}
              />
              {AGENTS_PUBLIC_FIELD_LABELS[key]}
              <code style={{ marginInlineStart: '0.35rem', opacity: 0.7 }}>
                {key === 'order' ? 'order' : key}
              </code>
            </label>
          ))}
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
