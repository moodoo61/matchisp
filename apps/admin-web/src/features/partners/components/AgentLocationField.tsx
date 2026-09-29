'use client';

import { useState } from 'react';
import { readDeviceLocation } from '@/features/partners/hooks/readDeviceLocation';
import { agentMapsUrl } from '@/features/partners/types';

type Props = {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  onChange: (coords: {
    latitude: number | null;
    longitude: number | null;
  }) => void;
};

function formatCoord(value: number) {
  return value.toFixed(6);
}

export function AgentLocationField({ latitude, longitude, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const hasLocation =
    typeof latitude === 'number' && typeof longitude === 'number';

  async function capture() {
    setBusy(true);
    setError(null);
    try {
      const loc = await readDeviceLocation();
      onChange({ latitude: loc.latitude, longitude: loc.longitude });
      setAccuracy(loc.accuracyMeters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديد الموقع');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="form-field-block">
      <div className="toolbar" style={{ marginBottom: 0, gap: '0.5rem' }}>
        <span>الموقع (لوكيشن الجهاز)</span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn secondary"
            type="button"
            disabled={busy}
            onClick={() => void capture()}
          >
            {busy ? 'جاري التحديد…' : hasLocation ? 'إعادة التحديد' : 'تحديد موقعي'}
          </button>
          {hasLocation ? (
            <button
              className="btn secondary"
              type="button"
              disabled={busy}
              onClick={() => {
                onChange({ latitude: null, longitude: null });
                setAccuracy(null);
                setError(null);
              }}
            >
              مسح الموقع
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {hasLocation ? (
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          {formatCoord(latitude)} ، {formatCoord(longitude)}
          {accuracy != null ? ` · دقة تقريبية ${Math.round(accuracy)} م` : ''}
          {' · '}
          <a
            href={agentMapsUrl(latitude, longitude)}
            target="_blank"
            rel="noreferrer"
          >
            فتح في الخريطة
          </a>
        </p>
      ) : (
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          اختياري — اضغط «تحديد موقعي» والسماح للمتصفح بقراءة موقع الهاتف.
        </p>
      )}
    </div>
  );
}
