'use client';

import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/features/partners/hooks/loadGoogleMaps';

export type MapCoords = { latitude: number; longitude: number };

type Props = {
  apiKey: string;
  /** مركز فتح الخريطة (مثل إحداثيات المنطقة) */
  center: MapCoords | null;
  /** الموقع المحدد حالياً (العلامة) */
  value: MapCoords | null;
  onChange: (coords: MapCoords) => void;
  height?: number;
};

type MapHandle = {
  setCenter: (pos: { lat: number; lng: number }) => void;
};

type MarkerHandle = {
  setPosition: (pos: { lat: number; lng: number }) => void;
  getPosition: () => { lat: () => number; lng: () => number } | null;
  addListener: (eventName: string, handler: () => void) => void;
};

const FALLBACK_CENTER = { lat: 15.4625, lng: 45.3258 }; // مأرب، اليمن

function toLatLng(coords: MapCoords) {
  return { lat: coords.latitude, lng: coords.longitude };
}

export function MapLocationPicker({
  apiKey,
  center,
  value,
  onChange,
  height = 320,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapHandle | null>(null);
  const markerRef = useRef<MarkerHandle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const initialCenter = value ?? center;
  const centerKey = center
    ? `${center.latitude},${center.longitude}`
    : 'none';
  const valueKey = value ? `${value.latitude},${value.longitude}` : 'none';

  useEffect(() => {
    if (!apiKey.trim() || !containerRef.current) return;
    let cancelled = false;

    void (async () => {
      try {
        const google = await loadGoogleMaps(apiKey);
        if (cancelled || !containerRef.current) return;

        // نفضّل فتح الخريطة على مركز المنطقة، والعلامة على موقع الوكيل إن وُجد
        const mapCenter = center
          ? toLatLng(center)
          : value
            ? toLatLng(value)
            : FALLBACK_CENTER;
        const markerPos = value ? toLatLng(value) : mapCenter;
        const zoom = center || value ? 14 : 11;

        const map = new google.maps.Map(containerRef.current, {
          center: mapCenter,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        const marker = new google.maps.Marker({
          position: markerPos,
          map,
          draggable: true,
        });

        mapRef.current = map;
        markerRef.current = marker;

        const emit = (lat: number, lng: number) => {
          onChangeRef.current({ latitude: lat, longitude: lng });
        };

        // بدون موقع سابق: نبدأ من مركز المنطقة ونخزّنه مباشرة
        if (!value && (center || initialCenter)) {
          const seed = center ?? initialCenter!;
          emit(seed.latitude, seed.longitude);
        }

        map.addListener(
          'click',
          (e: {
            latLng: { lat: () => number; lng: () => number } | null;
          }) => {
            const pos = e.latLng;
            if (!pos) return;
            const lat = pos.lat();
            const lng = pos.lng();
            marker.setPosition({ lat, lng });
            emit(lat, lng);
          },
        );

        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (!pos) return;
          emit(pos.lat(), pos.lng());
        });

        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'تعذر تحميل الخريطة',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current = null;
      markerRef.current = null;
    };
    // إعادة التهيئة عند تغيّر المفتاح أو مركز المنطقة
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, centerKey]);

  useEffect(() => {
    if (!value) return;
    const pos = toLatLng(value);
    markerRef.current?.setPosition(pos);
  }, [valueKey, value]);

  return (
    <div>
      <p className="muted" style={{ margin: '0 0 0.5rem' }}>
        انقر على الخريطة أو اسحب العلامة لتحديد الموقع — يُحفظ تلقائياً في
        حقول الإحداثيات
      </p>
      {error ? <p className="error">{error}</p> : null}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height,
          borderRadius: 10,
          border: '1px solid var(--border)',
          overflow: 'hidden',
          background: 'var(--bg)',
        }}
      />
    </div>
  );
}
