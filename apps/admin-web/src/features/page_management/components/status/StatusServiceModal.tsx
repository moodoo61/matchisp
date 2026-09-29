'use client';

import { FormEvent, useEffect, useState } from 'react';
import { uploadStatusServiceFile } from '@/features/page_management/api';
import type {
  StatusService,
  StatusServiceInput,
} from '@/features/page_management/types';
import {
  ImageUploadField,
  Modal,
  notifyMutation,
  useToast,
} from '@/shared/ui';

type Props = {
  state: StatusService | 'new' | null;
  onClose: () => void;
  onSave: (input: StatusServiceInput) => Promise<void>;
};

export function StatusServiceModal({ state, onClose, onSave }: Props) {
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
      await notifyMutation(
        toast,
        () =>
          onSave({
            name: name.trim(),
            imageUrl,
            linkUrl: linkUrl.trim(),
            sortOrder,
            isActive,
          }),
        {
          success:
            state === 'new' ? 'تم إضافة الخدمة بنجاح' : 'تم تعديل الخدمة بنجاح',
        },
      );
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
            form="status-service-form"
            disabled={busy}
          >
            حفظ
          </button>
        </>
      }
    >
      <form id="status-service-form" className="form" onSubmit={submit}>
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
              const res = await uploadStatusServiceFile(file);
              return res.imageUrl;
            }}
          />
        </label>
        <label>
          الرابط
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="مثل: live2/index.html أو $(link-break)"
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
