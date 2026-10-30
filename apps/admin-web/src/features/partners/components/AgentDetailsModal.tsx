'use client';

import type { ReactNode } from 'react';
import type { Agent } from '@/features/partners/types';
import { agentMapsUrl } from '@/features/partners/types';
import { Modal } from '@/shared/ui';

type Props = {
  agent: Agent | null;
  onClose: () => void;
  onEdit?: (agent: Agent) => void;
  canUpdate?: boolean;
};

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="form-display">
      <span className="form-display-label">{label}</span>
      <div className="form-display-value">{value || '—'}</div>
    </div>
  );
}

export function AgentDetailsModal({
  agent,
  onClose,
  onEdit,
  canUpdate,
}: Props) {
  return (
    <Modal
      open={!!agent}
      title={agent ? `تفاصيل: ${agent.name}` : 'تفاصيل الوكيل'}
      onClose={onClose}
      panelClassName="modal-panel-wide"
      footer={
        <div className="modal-footer-actions">
          <button className="btn secondary" type="button" onClick={onClose}>
            إغلاق
          </button>
          {agent && canUpdate && onEdit ? (
            <button
              className="btn"
              type="button"
              onClick={() => {
                onClose();
                onEdit(agent);
              }}
            >
              تعديل
            </button>
          ) : null}
        </div>
      }
    >
      {agent ? (
        <div className="form form-wide">
          <div className="form-grid-2">
            <Row label="اسم الوكيل" value={agent.name} />
            <Row label="اسم المحل" value={agent.shopName} />
            <Row label="المنطقة" value={agent.region || '—'} />
            <Row label="رقم الهاتف" value={agent.phone} />
          </div>
          <Row label="العنوان" value={agent.address} />
          <div className="form-grid-2">
            <Row label="الترتيب" value={String(agent.sortOrder)} />
            <Row
              label="API العام"
              value={
                <span className={`badge ${agent.isPublic ? 'ok' : ''}`}>
                  {agent.isPublic ? 'ظاهر' : 'مخفي'}
                </span>
              }
            />
          </div>
          <Row
            label="الموقع"
            value={
              agent.latitude != null && agent.longitude != null ? (
                <a
                  href={agentMapsUrl(agent.latitude, agent.longitude)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {agent.latitude.toFixed(6)} ، {agent.longitude.toFixed(6)}
                </a>
              ) : (
                '—'
              )
            }
          />
        </div>
      ) : null}
    </Modal>
  );
}
