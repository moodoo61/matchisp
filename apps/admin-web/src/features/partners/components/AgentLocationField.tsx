'use client';

import { useState } from 'react';
import { LocationMapModal } from '@/features/partners/components/LocationMapModal';
import type { MapCoords } from '@/features/partners/components/MapLocationPicker';
import { agentMapsUrl } from '@/features/partners/types';

type Props = {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  /** مركز الخريطة من إحداثيات المنطقة المختارة */
  regionCenter: MapCoords | null;
  regionName?: string;
  onChange: (coords: {
    latitude: number | null;
    longitude: number | null;
  }) => void;
};

function formatCoord(value: number) {
  return value.toFixed(6);
}

export function AgentLocationField({
  latitude,
  longitude,
  regionCenter,
  regionName,
  onChange,
}: Props) {
  const [mapOpen, setMapOpen] = useState(false);

  const hasLocation =
    typeof latitude === 'number' && typeof longitude === 'number';

  const value: MapCoords | null = hasLocation
    ? { latitude, longitude }
    : null;

  return (
    <div className="form-field-block">
      <div className="toolbar" style={{ marginBottom: 0, gap: '0.5rem' }}>
        <span>الموقع</span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn secondary"
            type="button"
            onClick={() => setMapOpen(true)}
          >
            {hasLocation ? 'تعديل على الخريطة' : 'فتح الخريطة'}
          </button>
          {hasLocation ? (
            <button
              className="btn secondary"
              type="button"
              onClick={() => onChange({ latitude: null, longitude: null })}
            >
              مسح الموقع
            </button>
          ) : null}
        </div>
      </div>

      {hasLocation ? (
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          {formatCoord(latitude)} ، {formatCoord(longitude)}
          {' · '}
          <a
            href={agentMapsUrl(latitude, longitude)}
            target="_blank"
            rel="noreferrer"
          >
            فتح في Google Maps
          </a>
        </p>
      ) : (
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          اختياري — افتح الخريطة
          {regionName ? ` حول منطقة «${regionName}»` : ''} وحدد موقع الوكيل؛
          تُحفظ الإحداثيات تلقائياً.
          {!regionCenter
            ? ' (حدّد موقع المنطقة أولاً من تبويب المناطق لفتح الخريطة على مركزها)'
            : ''}
        </p>
      )}

      <LocationMapModal
        open={mapOpen}
        title={
          regionName
            ? `تحديد موقع الوكيل — ${regionName}`
            : 'تحديد موقع الوكيل'
        }
        center={regionCenter ?? value}
        value={value}
        onClose={() => setMapOpen(false)}
        onConfirm={(coords) =>
          onChange({
            latitude: coords.latitude,
            longitude: coords.longitude,
          })
        }
      />
    </div>
  );
}
