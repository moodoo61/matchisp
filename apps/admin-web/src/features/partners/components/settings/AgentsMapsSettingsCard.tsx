'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  getAgentsMapsSettings,
  updateAgentsMapsSettings,
} from '@/features/partners/api';
import type { AgentsMapsSettings } from '@/features/partners/types';
import { usePermissions } from '@/lib/usePermissions';
import { TaskCard, notifyMutation, useToast } from '@/shared/ui';

const EMPTY: AgentsMapsSettings = { googleMapsApiKey: '' };

export function AgentsMapsSettingsCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PARTNERS_READ);
  const canUpdate = can(PERMISSIONS.PARTNERS_UPDATE);
  const toast = useToast();
  const [form, setForm] = useState<AgentsMapsSettings>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      setForm(await getAgentsMapsSettings());
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
          updateAgentsMapsSettings({
            googleMapsApiKey: form.googleMapsApiKey,
          }),
        { success: 'تم حفظ إعدادات الخرائط' },
      );
      setForm(next);
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  if (!canRead) return null;

  return (
    <TaskCard title="خرائط Google">
      {error ? <p className="error">{error}</p> : null}
      <p className="muted">
        مفتاح Google Maps JavaScript API لاختيار موقع الوكيل على الخريطة داخل
        نموذج الإضافة/التعديل. بدون المفتاح يبقى تحديد الموقع عبر GPS أو الإدخال
        اليدوي.
      </p>
      <div className="form form-wide">
        <label>
          مفتاح API
          <input
            type="password"
            autoComplete="off"
            value={form.googleMapsApiKey}
            disabled={!canUpdate || busy}
            onChange={(e) =>
              setForm({ ...form, googleMapsApiKey: e.target.value })
            }
            placeholder="AIza…"
          />
        </label>
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
