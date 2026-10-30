'use client';

import { useEffect, useState } from 'react';
import { getAgentsMapsSettings } from '@/features/partners/api';
import {
  MapLocationPicker,
  type MapCoords,
} from '@/features/partners/components/MapLocationPicker';
import { Modal } from '@/shared/ui';

type Props = {
  open: boolean;
  title: string;
  /** مركز فتح الخريطة (إحداثيات المنطقة) */
  center: MapCoords | null;
  /** الموقع الحالي المحدد */
  value: MapCoords | null;
  onClose: () => void;
  onConfirm: (coords: MapCoords) => void;
};

export function LocationMapModal({
  open,
  title,
  center,
  value,
  onClose,
  onConfirm,
}: Props) {
  const [apiKey, setApiKey] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<MapCoords | null>(value);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    setLoadError(null);
    void getAgentsMapsSettings()
      .then((s) => {
        const key = s.googleMapsApiKey?.trim() ?? '';
        setApiKey(key);
        if (!key) {
          setLoadError(
            'أضف مفتاح Google Maps من تبويب الضبط لفتح الخريطة',
          );
        }
      })
      .catch((err) => {
        setLoadError(
          err instanceof Error ? err.message : 'تعذر جلب إعدادات الخرائط',
        );
      });
  }, [open, value]);

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      panelClassName="modal-panel-wide"
      footer={
        <div className="modal-footer-actions">
          <button className="btn secondary" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn"
            type="button"
            disabled={!draft}
            onClick={() => {
              if (!draft) return;
              onConfirm(draft);
              onClose();
            }}
          >
            تأكيد الموقع
          </button>
        </div>
      }
    >
      {loadError ? <p className="error">{loadError}</p> : null}
      {open && apiKey ? (
        <MapLocationPicker
          apiKey={apiKey}
          center={center}
          value={draft}
          onChange={setDraft}
          height={360}
        />
      ) : null}
      {draft ? (
        <p className="muted" style={{ marginTop: '0.65rem' }}>
          المحدد: {draft.latitude.toFixed(6)} ، {draft.longitude.toFixed(6)}
        </p>
      ) : null}
    </Modal>
  );
}
