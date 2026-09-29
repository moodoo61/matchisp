'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import { getEncodingStatus } from '@/features/live/api';
import type {
  ComponentStatus,
  EncodingRuntimeStatus,
} from '@/features/live/types';
import { usePermissions } from '@/lib/usePermissions';
import { IconButton, TaskCard } from '@/shared/ui';

const STATUS_LABEL: Record<ComponentStatus, string> = {
  ok: 'جاهز',
  degraded: 'محدود',
  missing: 'غير متوفر',
  error: 'خطأ',
};

function StatusPill({ status }: { status: ComponentStatus }) {
  return (
    <span className={`status-pill status-${status}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function EncodingRuntimeStatusCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.LIVE_ENCODING_READ);
  const [data, setData] = useState<EncodingRuntimeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      setData(await getEncodingStatus());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب الحالة');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
  }, [canRead, reload]);

  if (!canRead) return null;

  return (
    <TaskCard
      title="حالة الترميز"
      actions={
        <IconButton
          label="تحديث"
          onClick={() => void reload()}
          disabled={busy}
        >
          ↻
        </IconButton>
      }
    >
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p className="muted">جاري الفحص…</p> : null}
      {data ? (
        <>
          <div className="runtime-status-grid">
            <article className="runtime-status-item">
              <header>
                <strong>GPU</strong>
                <StatusPill status={data.gpu.status} />
              </header>
              <p>{data.gpu.name || '—'}</p>
              <small>{data.gpu.detail}</small>
              {data.gpu.driver ? (
                <small className="runtime-meta">Driver: {data.gpu.driver}</small>
              ) : null}
            </article>

            <article className="runtime-status-item">
              <header>
                <strong>المرمز</strong>
                <StatusPill status={data.encoder.status} />
              </header>
              <p>{data.encoder.preferred || '—'}</p>
              <small>{data.encoder.detail}</small>
              {data.encoder.hardware.length ? (
                <small className="runtime-meta">
                  عتاد: {data.encoder.hardware.join(', ')}
                </small>
              ) : null}
              {data.encoder.software.length ? (
                <small className="runtime-meta">
                  برمجي: {data.encoder.software.join(', ')}
                </small>
              ) : null}
            </article>

            <article className="runtime-status-item">
              <header>
                <strong>FFmpeg</strong>
                <StatusPill status={data.ffmpeg.status} />
              </header>
              <p>{data.ffmpeg.version || '—'}</p>
              <small>{data.ffmpeg.detail}</small>
              {data.ffmpeg.path ? (
                <small className="runtime-meta" dir="ltr">
                  {data.ffmpeg.path}
                </small>
              ) : null}
            </article>

            <article className="runtime-status-item">
              <header>
                <strong>MistServer</strong>
                <StatusPill status={data.mistserver.status} />
              </header>
              <p>{data.mistserver.available ? 'متصل' : 'غير متصل'}</p>
              <small>{data.mistserver.detail}</small>
              {data.mistserver.url ? (
                <small className="runtime-meta" dir="ltr">
                  {data.mistserver.url}
                </small>
              ) : null}
            </article>
          </div>
          <p className="muted runtime-checked">
            آخر فحص:{' '}
            {new Date(data.checkedAt).toLocaleString('ar-IQ', {
              hour12: false,
            })}
          </p>
        </>
      ) : null}
    </TaskCard>
  );
}
