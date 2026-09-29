'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createTextAd,
  updateTextAd,
} from '@/features/page_management/api';
import type { TextAd, TextAdInput } from '@/features/page_management/types';
import { Modal, notifyMutation, useToast } from '@/shared/ui';

type Props = {
  state: TextAd | 'new' | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export function LoginTextAdModal({ state, onClose, onSaved }: Props) {
  const toast = useToast();
  const initial = state && state !== 'new' ? state : null;
  const [text, setText] = useState(initial?.text ?? '');
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state === 'new') {
      setText('');
      setSortOrder(0);
      setIsActive(true);
      return;
    }
    setText(state.text);
    setSortOrder(state.sortOrder);
    setIsActive(state.isActive);
  }, [state]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const input: TextAdInput = { text, sortOrder, isActive };
      await notifyMutation(
        toast,
        async () => {
          if (state === 'new') await createTextAd(input);
          else if (state) await updateTextAd(state.id, input);
        },
        {
          success:
            state === 'new' ? 'تم إضافة إعلان النص بنجاح' : 'تم تعديل إعلان النص بنجاح',
        },
      );
      onClose();
      await onSaved();
    } catch {
      // الإشعار عبر notifyMutation
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={!!state}
      title={state === 'new' ? 'إضافة إعلان نص' : 'تعديل إعلان نص'}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn"
            type="submit"
            form="text-ad-form"
            disabled={busy}
          >
            حفظ
          </button>
        </>
      }
    >
      <form id="text-ad-form" className="form" onSubmit={submit}>
        <label>
          النص
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            rows={3}
          />
        </label>
        <label>
          الترتيب
          <input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          نشط
        </label>
      </form>
    </Modal>
  );
}
