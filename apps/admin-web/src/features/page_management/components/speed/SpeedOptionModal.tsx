'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createSpeedOption,
  updateSpeedOption,
} from '@/features/page_management/api';
import type {
  SpeedOption,
  SpeedOptionInput,
} from '@/features/page_management/types';
import { Modal, notifyMutation, useToast } from '@/shared/ui';

type Props = {
  state: SpeedOption | 'new' | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export function SpeedOptionModal({ state, onClose, onSaved }: Props) {
  const toast = useToast();
  const initial = state && state !== 'new' ? state : null;
  const [name, setName] = useState(initial?.name ?? '');
  const [value, setValue] = useState(initial?.value ?? '');
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state === 'new') {
      setName('');
      setValue('');
      setIsDefault(false);
      setSortOrder(0);
      setIsActive(true);
      return;
    }
    setName(state.name);
    setValue(state.value);
    setIsDefault(state.isDefault);
    setSortOrder(state.sortOrder);
    setIsActive(state.isActive);
  }, [state]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const input: SpeedOptionInput = {
        name: name.trim(),
        value: value.trim(),
        isDefault,
        sortOrder,
        isActive,
      };
      await notifyMutation(
        toast,
        async () => {
          if (state === 'new') await createSpeedOption(input);
          else if (state) await updateSpeedOption(state.id, input);
        },
        {
          success:
            state === 'new'
              ? 'تم إضافة خيار السرعة'
              : 'تم تعديل خيار السرعة',
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
      title={state === 'new' ? 'إضافة خيار سرعة' : 'تعديل خيار سرعة'}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn"
            type="submit"
            form="speed-option-form"
            disabled={busy}
          >
            حفظ
          </button>
        </>
      }
    >
      <form id="speed-option-form" className="form" onSubmit={submit}>
        <label>
          الاسم المعروض
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="سرعة عالية 3M"
            required
          />
        </label>
        <label>
          قيمة الراوتر (domain)
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="1M/3M"
            required
          />
        </label>
        <p className="muted" style={{ margin: 0 }}>
          يجب أن تطابق قيمة بروفايل MikroTik (مثل open أو 512k/1M). خيار «كروت
          هوتسبوت» ثابت في الصفحة وليس من هنا.
        </p>
        <label>
          الترتيب
          <input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
          />
        </label>
        <label>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            افتراضي عند فتح صفحة الدخول
          </span>
        </label>
        <label>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            نشط (يظهر في الراوتر)
          </span>
        </label>
      </form>
    </Modal>
  );
}
