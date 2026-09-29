'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createAgent, updateAgent } from '@/features/partners/api';
import { AgentLocationField } from '@/features/partners/components/AgentLocationField';
import type { Agent, AgentInput } from '@/features/partners/types';
import { Modal, notifyMutation, useToast } from '@/shared/ui';

export type AgentModalState = Agent | 'new' | null;

type Props = {
  state: AgentModalState;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

const EMPTY: AgentInput = {
  name: '',
  shopName: '',
  region: 'أخرى',
  address: '',
  phone: '',
  latitude: null,
  longitude: null,
  sortOrder: 0,
  isPublic: true,
};

export function AgentModal({ state, onClose, onSaved }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<AgentInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isNew = state === 'new';

  useEffect(() => {
    if (!state) return;
    setError(null);
    if (state === 'new') {
      setForm({ ...EMPTY });
      return;
    }
    setForm({
      name: state.name,
      shopName: state.shopName,
      region: state.region || 'أخرى',
      address: state.address,
      phone: state.phone,
      latitude: state.latitude,
      longitude: state.longitude,
      sortOrder: state.sortOrder ?? 0,
      isPublic: state.isPublic ?? true,
    });
  }, [state]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (state === 'new') {
        await notifyMutation(toast, () => createAgent(form), {
          success: 'تمت إضافة الوكيل',
        });
      } else if (state) {
        await notifyMutation(toast, () => updateAgent(state.id, form), {
          success: 'تم تعديل الوكيل',
        });
      }
      onClose();
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={!!state}
      title={isNew ? 'إضافة وكيل' : 'تعديل وكيل'}
      onClose={onClose}
      footer={
        <div className="modal-footer-actions">
          <button className="btn secondary" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn"
            type="submit"
            form="partners-agent-form"
            disabled={busy}
          >
            حفظ
          </button>
        </div>
      }
    >
      <form id="partners-agent-form" className="form" onSubmit={submit}>
        {error ? <p className="error">{error}</p> : null}
        <label>
          اسم الوكيل
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            minLength={2}
          />
        </label>
        <label>
          اسم المحل
          <input
            value={form.shopName}
            onChange={(e) => setForm({ ...form, shopName: e.target.value })}
            required
            minLength={2}
          />
        </label>
        <label>
          المنطقة
          <input
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            required
            minLength={1}
            placeholder="مثال: الكرادة"
          />
        </label>
        <label>
          العنوان
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
            minLength={2}
          />
        </label>
        <label>
          رقم الهاتف
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
            minLength={5}
            inputMode="tel"
          />
        </label>
        <label>
          الترتيب
          <input
            type="number"
            value={form.sortOrder ?? 0}
            onChange={(e) =>
              setForm({ ...form, sortOrder: Number(e.target.value) || 0 })
            }
          />
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={form.isPublic ?? true}
            onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
          />
          إظهار في API العام
        </label>
        <AgentLocationField
          latitude={form.latitude}
          longitude={form.longitude}
          onChange={({ latitude, longitude }) =>
            setForm({ ...form, latitude, longitude })
          }
        />
      </form>
    </Modal>
  );
}
