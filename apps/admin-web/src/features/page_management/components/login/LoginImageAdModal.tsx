'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createImageAd,
  updateImageAd,
  uploadImageAdFile,
} from '@/features/page_management/api';
import type { ImageAd, ImageAdInput } from '@/features/page_management/types';
import { ImageUploadField, Modal, notifyMutation, useToast } from '@/shared/ui';

type Props = {
  state: ImageAd | 'new' | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export function LoginImageAdModal({ state, onClose, onSaved }: Props) {
  const toast = useToast();
  const initial = state && state !== 'new' ? state : null;
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? '');
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state === 'new') {
      setImageUrl('');
      setLinkUrl('');
      setSortOrder(0);
      setIsActive(true);
      return;
    }
    setImageUrl(state.imageUrl);
    setLinkUrl(state.linkUrl ?? '');
    setSortOrder(state.sortOrder);
    setIsActive(state.isActive);
  }, [state]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const input: ImageAdInput = {
        imageUrl,
        linkUrl: linkUrl.trim() || undefined,
        sortOrder,
        isActive,
      };
      await notifyMutation(
        toast,
        async () => {
          if (state === 'new') await createImageAd(input);
          else if (state) await updateImageAd(state.id, input);
        },
        {
          success:
            state === 'new' ? 'تم إضافة إعلان الصورة بنجاح' : 'تم تعديل إعلان الصورة بنجاح',
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
      title={state === 'new' ? 'إضافة إعلان صورة' : 'تعديل إعلان صورة'}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn"
            type="submit"
            form="image-ad-form"
            disabled={busy}
          >
            حفظ
          </button>
        </>
      }
    >
      <form id="image-ad-form" className="form" onSubmit={submit}>
        <label>
          الصورة
          <ImageUploadField
            value={imageUrl}
            onChange={setImageUrl}
            onUpload={async (file) => {
              const res = await uploadImageAdFile(file);
              return res.imageUrl;
            }}
          />
        </label>
        <label>
          رابط الإعلان
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
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
