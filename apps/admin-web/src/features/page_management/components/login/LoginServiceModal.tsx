'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createLoginService,
  updateLoginService,
  uploadLoginServiceFile,
} from '@/features/page_management/api';
import type {
  LoginService,
  LoginServiceInput,
} from '@/features/page_management/types';
import { ImageUploadField, Modal, notifyMutation, useToast } from '@/shared/ui';

type Props = {
  state: LoginService | 'new' | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export function LoginServiceModal({ state, onClose, onSaved }: Props) {
  const toast = useToast();
  const initial = state && state !== 'new' ? state : null;
  const [name, setName] = useState(initial?.name ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? '');
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state === 'new') {
      setName('');
      setImageUrl('');
      setLinkUrl('');
      setSortOrder(0);
      setIsActive(true);
      return;
    }
    setName(state.name);
    setImageUrl(state.imageUrl);
    setLinkUrl(state.linkUrl);
    setSortOrder(state.sortOrder);
    setIsActive(state.isActive);
  }, [state]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const input: LoginServiceInput = {
        name: name.trim(),
        imageUrl,
        linkUrl: linkUrl.trim(),
        sortOrder,
        isActive,
      };
      await notifyMutation(
        toast,
        async () => {
          if (state === 'new') await createLoginService(input);
          else if (state) await updateLoginService(state.id, input);
        },
        {
          success:
            state === 'new' ? 'تم إضافة الخدمة بنجاح' : 'تم تعديل الخدمة بنجاح',
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
      title={state === 'new' ? 'إضافة خدمة' : 'تعديل خدمة'}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn"
            type="submit"
            form="login-service-form"
            disabled={busy}
          >
            حفظ
          </button>
        </>
      }
    >
      <form id="login-service-form" className="form" onSubmit={submit}>
        <label>
          الاسم
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          الصورة
          <ImageUploadField
            value={imageUrl}
            onChange={setImageUrl}
            onUpload={async (file) => {
              const res = await uploadLoginServiceFile(file);
              return res.imageUrl;
            }}
          />
        </label>
        <label>
          الرابط
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
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
