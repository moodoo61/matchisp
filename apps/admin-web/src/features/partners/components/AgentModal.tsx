'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createAgent,
  createRegion,
  listRegions,
  updateAgent,
} from '@/features/partners/api';
import { AgentLocationField } from '@/features/partners/components/AgentLocationField';
import { findAgentDuplicates } from '@/features/partners/hooks/findAgentDuplicates';
import type { Agent, AgentInput, Region } from '@/features/partners/types';
import { regionCenter } from '@/features/partners/types';
import { Modal, notifyMutation, useToast } from '@/shared/ui';

export type AgentModalState = Agent | 'new' | null;

type Props = {
  state: AgentModalState;
  agents: Agent[];
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

export function AgentModal({ state, agents, onClose, onSaved }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<AgentInput>(EMPTY);
  const [regions, setRegions] = useState<Region[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [addingRegion, setAddingRegion] = useState(false);
  const isNew = state === 'new';
  const excludeId = state && state !== 'new' ? state.id : undefined;

  const duplicates = useMemo(
    () => findAgentDuplicates(agents, form, excludeId),
    [agents, form, excludeId],
  );

  const selectedRegion = useMemo(
    () => regions.find((r) => r.name === form.region) ?? null,
    [regions, form.region],
  );

  async function reloadRegions(preferName?: string) {
    const items = await listRegions();
    setRegions(items);
    if (preferName) {
      setForm((prev) => ({ ...prev, region: preferName }));
    } else if (
      items.length &&
      !items.some((r) => r.name === form.region)
    ) {
      setForm((prev) => ({
        ...prev,
        region: items[0]?.name ?? 'أخرى',
      }));
    }
  }

  useEffect(() => {
    if (!state) return;
    setError(null);
    void listRegions()
      .then((items) => {
        setRegions(items);
        if (state === 'new') {
          setForm({
            ...EMPTY,
            region: items.find((r) => r.name === 'أخرى')?.name ?? items[0]?.name ?? 'أخرى',
          });
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
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'تعذر جلب المناطق');
      });
  }, [state]);

  async function addRegionQuick() {
    const name = window.prompt('اسم المنطقة الجديدة')?.trim();
    if (!name) return;
    setAddingRegion(true);
    try {
      const region = await notifyMutation(
        toast,
        () => createRegion({ name }),
        { success: 'تمت إضافة المنطقة' },
      );
      await reloadRegions(region.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إضافة المنطقة');
    } finally {
      setAddingRegion(false);
    }
  }

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
          {duplicates.name ? (
            <p className="field-warn">{duplicates.name}</p>
          ) : null}
        </label>
        <div>
          <div className="field-row">
            <label className="field-grow">
              اسم المحل
              <input
                value={form.shopName}
                onChange={(e) =>
                  setForm({ ...form, shopName: e.target.value })
                }
                required
                minLength={2}
              />
            </label>
            <button
              className="btn secondary"
              type="button"
              title="نسخ اسم الوكيل إلى اسم المحل"
              disabled={!form.name.trim()}
              onClick={() =>
                setForm({ ...form, shopName: form.name.trim() })
              }
            >
              =
            </button>
          </div>
          {duplicates.shopName ? (
            <p className="field-warn">{duplicates.shopName}</p>
          ) : null}
        </div>
        <div className="field-row">
          <label className="field-grow">
            المنطقة
            <select
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              required
            >
              {regions.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn secondary"
            type="button"
            title="إضافة منطقة"
            disabled={addingRegion}
            onClick={() => void addRegionQuick()}
          >
            +
          </button>
        </div>
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
          {duplicates.phone ? (
            <p className="field-warn">{duplicates.phone}</p>
          ) : null}
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
          regionCenter={regionCenter(selectedRegion)}
          regionName={selectedRegion?.name}
          onChange={({ latitude, longitude }) =>
            setForm({ ...form, latitude, longitude })
          }
        />
      </form>
    </Modal>
  );
}
