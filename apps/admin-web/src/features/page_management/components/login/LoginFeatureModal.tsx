'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createLoginFeature,
  updateLoginFeature,
  uploadLoginFeatureFile,
} from '@/features/page_management/api';
import type {
  LoginFeature,
  LoginFeatureInput,
} from '@/features/page_management/types';
import { ImageUploadField, Modal, notifyMutation, useToast } from '@/shared/ui';

type Props = {
  state: LoginFeature | 'new' | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export function LoginFeatureModal({ state, onClose, onSaved }: Props) {
  const toast = useToast();
  const initial = state && state !== 'new' ? state : null;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state === 'new') {
      setTitle('');
      setIcon('');
      setImageUrl('');
      setSortOrder(0);
      setIsActive(true);
      return;
    }
    setTitle(state.title);
    setIcon(state.icon ?? '');
    setImageUrl(state.imageUrl);
    setSortOrder(state.sortOrder);
    setIsActive(state.isActive);
  }, [state]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const input: LoginFeatureInput = {
        title: title.trim(),
        icon: icon.trim(),
        imageUrl,
        sortOrder,
        isActive,
      };
      await notifyMutation(
        toast,
        async () => {
          if (state === 'new') await createLoginFeature(input);
          else if (state) await updateLoginFeature(state.id, input);
        },
        {
          success:
            state === 'new' ? 'تم إضافة الميزة بنجاح' : 'تم تعديل الميزة بنجاح',
        },
      );
      onClose();
      await onSaved();
    } catch {
      // notifyMutation
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={!!state}
      title={state === 'new' ? 'إضافة ميزة' : 'تعديل ميزة'}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn"
            type="submit"
            form="login-feature-form"
            disabled={busy || !imageUrl}
          >
            حفظ
          </button>
        </>
      }
    >
      <form id="login-feature-form" className="form" onSubmit={submit}>
        <label>
          نص الميزة
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label>
          الأيقونة (اختياري)
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🛫"
          />
        </label>
        <label>
          صورة الخلفية
          <ImageUploadField
            value={imageUrl}
            onChange={setImageUrl}
            onUpload={async (file) => {
              const res = await uploadLoginFeatureFile(file);
              return res.imageUrl;
            }}
          />
        </label>
        <label>
          الترتيب
          <input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
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
