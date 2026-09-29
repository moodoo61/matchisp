'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  getEncodingQuality,
  updateEncodingQuality,
} from '@/features/live/api';
import type {
  EncodingQualityRung,
  EncodingQualitySettingsView,
} from '@/features/live/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  CardEnableToggle,
  TaskCard,
  notifyMutation,
  useToast,
} from '@/shared/ui';

function cloneRungs(rungs: EncodingQualityRung[]) {
  return rungs.map((rung) => ({ ...rung }));
}

export function EncodingQualityOptionsCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.LIVE_ENCODING_READ);
  const canManage = can(PERMISSIONS.LIVE_ENCODING_UPDATE);
  const toast = useToast();
  const [data, setData] = useState<EncodingQualitySettingsView | null>(null);
  const [rungs, setRungs] = useState<EncodingQualityRung[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const next = await getEncodingQuality();
      setData(next);
      setRungs(cloneRungs(next.rungs));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب إعدادات الجودة');
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
  }, [canRead, reload]);

  const toggleEnabled = (index: number) => {
    setRungs((prev) =>
      prev.map((rung, i) =>
        i === index ? { ...rung, enabled: !rung.enabled } : rung,
      ),
    );
  };

  const updateRate = (
    index: number,
    key: 'bitrateKbps' | 'maxrateKbps' | 'bufsizeKbps',
    raw: string,
  ) => {
    const num = Number(raw);
    if (!Number.isFinite(num)) return;
    setRungs((prev) =>
      prev.map((rung, i) => (i === index ? { ...rung, [key]: num } : rung)),
    );
  };

  const syncBitrateTriplet = (index: number, value: number) => {
    setRungs((prev) =>
      prev.map((rung, i) =>
        i === index
          ? {
              ...rung,
              bitrateKbps: value,
              maxrateKbps: value,
              bufsizeKbps: value,
            }
          : rung,
      ),
    );
  };

  async function save() {
    if (!canManage || !data) return;
    if (!rungs.some((rung) => rung.enabled)) {
      setError('يجب تفعيل جودة واحدة على الأقل');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await notifyMutation(
        toast,
        () =>
          updateEncodingQuality({
            rungs: rungs.map((rung) => ({
              id: rung.id,
              enabled: rung.enabled,
              bitrateKbps: rung.bitrateKbps,
              maxrateKbps: rung.maxrateKbps,
              bufsizeKbps: rung.bufsizeKbps,
            })),
          }),
        { success: 'تم حفظ خيارات الجودة' },
      );
      setData(next);
      setRungs(cloneRungs(next.rungs));
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  if (!canRead) return null;

  return (
    <TaskCard
      title="خيارات الجودة"
      actions={
        canManage ? (
          <button
            className="btn"
            type="button"
            disabled={busy || !data}
            onClick={() => void save()}
          >
            حفظ
          </button>
        ) : null
      }
    >
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p className="muted">جاري التحميل…</p> : null}
      {data ? (
        <div className="encoding-quality-list">
          {rungs.map((rung, index) => (
            <div
              key={rung.id}
              className={
                rung.enabled
                  ? 'encoding-quality-row field-row'
                  : 'encoding-quality-row field-row is-disabled'
              }
            >
              <span className="encoding-quality-name" title={rung.label}>
                {rung.label}
              </span>
              <label className="encoding-quality-field">
                <span className="field-caption">bitrate</span>
                <input
                  type="number"
                  min={50}
                  value={rung.bitrateKbps}
                  disabled={!canManage || busy || !rung.enabled}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (Number.isFinite(value)) {
                      syncBitrateTriplet(index, value);
                    }
                  }}
                />
              </label>
              <label className="encoding-quality-field">
                <span className="field-caption">maxrate</span>
                <input
                  type="number"
                  min={50}
                  value={rung.maxrateKbps}
                  disabled={!canManage || busy || !rung.enabled}
                  onChange={(e) =>
                    updateRate(index, 'maxrateKbps', e.target.value)
                  }
                />
              </label>
              <label className="encoding-quality-field">
                <span className="field-caption">bufsize</span>
                <input
                  type="number"
                  min={50}
                  value={rung.bufsizeKbps}
                  disabled={!canManage || busy || !rung.enabled}
                  onChange={(e) =>
                    updateRate(index, 'bufsizeKbps', e.target.value)
                  }
                />
              </label>
              {canManage ? (
                <CardEnableToggle
                  enabled={rung.enabled}
                  busy={busy}
                  onToggle={() => toggleEnabled(index)}
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </TaskCard>
  );
}
