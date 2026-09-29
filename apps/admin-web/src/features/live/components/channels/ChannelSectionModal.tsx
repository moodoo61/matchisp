'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createChannelSection,
  updateChannelSection,
} from '@/features/live/api';
import type { ChannelSection } from '@/features/live/types';
import { Modal, notifyMutation, useToast } from '@/shared/ui';

export type ChannelSectionModalState = ChannelSection | 'new' | null;

type Props = {
  state: ChannelSectionModalState;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export function ChannelSectionModal({ state, onClose, onSaved }: Props) {
  const toast = useToast();
  const initial = state && state !== 'new' ? state : null;
  const [label, setLabel] = useState(initial?.label ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state) return;
    if (state === 'new') {
      setLabel('');
      setName('');
      setSortOrder(0);
      setError(null);
      return;
    }
    setLabel(state.label);
    setName(state.name);
    setSortOrder(state.sortOrder);
    setError(null);
  }, [state]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await notifyMutation(
        toast,
        async () => {
          if (state === 'new') {
            await createChannelSection({
              label: label.trim(),
              name: name.trim(),
            });
          } else if (state) {
            await updateChannelSection(state.id, {
              label: label.trim(),
              name: name.trim(),
              sortOrder,
            });
          }
        },
        {
          success:
            state === 'new' ? 'تم إضافة القسم بنجاح' : 'تم تعديل القسم بنجاح',
        },
      );
      onClose();
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الحفظ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={!!state}
      title={state === 'new' ? 'إضافة قسم' : 'تعديل قسم'}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn"
            type="submit"
            form="live-section-form"
            disabled={busy}
          >
            حفظ
          </button>
        </>
      }
    >
      <form id="live-section-form" className="form" onSubmit={submit}>
        {error ? <p className="error">{error}</p> : null}
        <label>
          اسم القسم (للعرض)
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="مثال: رياضة"
            required
            autoFocus
          />
        </label>
        <label>
          name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: sports"
            dir="ltr"
            required
            pattern="[a-zA-Z0-9][a-zA-Z0-9_-]*"
            title="إنجليزي فقط (a-z, 0-9, _, -)"
          />
        </label>
        {state && state !== 'new' ? (
          <label>
            الترتيب
            <input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </label>
        ) : null}
      </form>
    </Modal>
  );
}
