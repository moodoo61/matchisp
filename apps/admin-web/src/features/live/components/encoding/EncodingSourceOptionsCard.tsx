'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  getEncodingSettings,
  updateEncodingSettings,
} from '@/features/live/api';
import type {
  EncodingSettings,
  EncodingSourceMode,
} from '@/features/live/types';
import { usePermissions } from '@/lib/usePermissions';
import { TaskCard, useToast, notifyMutation } from '@/shared/ui';

export function EncodingSourceOptionsCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.LIVE_ENCODING_READ);
  const canManage = can(PERMISSIONS.LIVE_ENCODING_UPDATE);
  const toast = useToast();
  const [data, setData] = useState<EncodingSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      setData(await getEncodingSettings());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب الإعدادات');
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
  }, [canRead, reload]);

  const selectMode = async (sourceMode: EncodingSourceMode) => {
    const option = data?.options.find((item) => item.value === sourceMode);
    if (
      !canManage ||
      busy ||
      !option?.available ||
      data?.sourceMode === sourceMode
    ) {
      return;
    }
    setBusy(true);
    try {
      const next = await notifyMutation(
        toast,
        () => updateEncodingSettings({ sourceMode }),
        { success: 'تم تحديث خيار المصدر' },
      );
      setData(next);
    } catch {
      /* toast already shown */
    } finally {
      setBusy(false);
    }
  };

  if (!canRead) return null;

  return (
    <TaskCard title="خيارات المصدر">
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p className="muted">جاري التحميل…</p> : null}
      {data ? (
        <div
          className="encoding-source-grid"
          role="radiogroup"
          aria-label="خيارات المصدر"
        >
          {data.options.map((option) => {
            const selected = data.sourceMode === option.value;
            const disabled = !canManage || busy || !option.available;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={
                  selected
                    ? 'encoding-source-option is-selected'
                    : option.available
                      ? 'encoding-source-option'
                      : 'encoding-source-option is-unavailable'
                }
                disabled={disabled}
                onClick={() => void selectMode(option.value)}
              >
                <span className="encoding-source-radio" aria-hidden />
                <span className="encoding-source-text">
                  <strong>{option.label}</strong>
                  <small>
                    {option.available
                      ? option.description
                      : 'قريباً — لم يُنفَّذ بعد'}
                  </small>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
      {data && !canManage ? (
        <p className="muted encoding-source-hint">عرض فقط — لا صلاحية تعديل</p>
      ) : null}
    </TaskCard>
  );
}
