'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createLoginPackage,
  updateLoginPackage,
} from '@/features/page_management/api';
import type {
  LoginPackage,
  LoginPackageInput,
} from '@/features/page_management/types';
import { Modal, notifyMutation, useToast } from '@/shared/ui';

type Props = {
  state: LoginPackage | 'new' | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export function LoginPackageModal({ state, onClose, onSaved }: Props) {
  const toast = useToast();
  const initial = state && state !== 'new' ? state : null;
  const [name, setName] = useState(initial?.name ?? '');
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [time, setTime] = useState(initial?.time ?? '');
  const [download, setDownload] = useState(initial?.download ?? '');
  const [validity, setValidity] = useState(initial?.validity ?? '');
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state === 'new') {
      setName('');
      setPrice(0);
      setTime('');
      setDownload('');
      setValidity('');
      setSortOrder(0);
      setIsActive(true);
      return;
    }
    setName(state.name);
    setPrice(state.price);
    setTime(state.time);
    setDownload(state.download);
    setValidity(state.validity);
    setSortOrder(state.sortOrder);
    setIsActive(state.isActive);
  }, [state]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const input: LoginPackageInput = {
        name: name.trim(),
        price,
        time: time.trim(),
        download: download.trim(),
        validity: validity.trim(),
        sortOrder,
        isActive,
      };
      await notifyMutation(
        toast,
        async () => {
          if (state === 'new') await createLoginPackage(input);
          else if (state) await updateLoginPackage(state.id, input);
        },
        {
          success:
            state === 'new' ? 'تم إضافة الباقة بنجاح' : 'تم تعديل الباقة بنجاح',
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
      title={state === 'new' ? 'إضافة باقة' : 'تعديل باقة'}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn"
            type="submit"
            form="login-package-form"
            disabled={busy}
          >
            حفظ
          </button>
        </>
      }
    >
      <form id="login-package-form" className="form" onSubmit={submit}>
        <label>
          الاسم
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          السعر
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            required
          />
        </label>
        <label>
          الوقت
          <input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="مثل: 30 يوم"
            required
          />
        </label>
        <label>
          التحميل
          <input
            value={download}
            onChange={(e) => setDownload(e.target.value)}
            placeholder="مثل: غير محدود"
            required
          />
        </label>
        <label>
          الصلاحية
          <input
            value={validity}
            onChange={(e) => setValidity(e.target.value)}
            placeholder="مثل: صالح لمدة 30 يوم"
            required
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
