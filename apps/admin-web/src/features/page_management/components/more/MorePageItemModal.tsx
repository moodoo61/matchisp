'use client';

import { FormEvent, useEffect, useState } from 'react';
import { uploadMorePageItemFile } from '@/features/page_management/api';
import type {
  MorePageItem,
  MorePageItemInput,
} from '@/features/page_management/types';
import {
  ImageUploadField,
  Modal,
  notifyMutation,
  useToast,
} from '@/shared/ui';

type Props = {
  state: MorePageItem | 'new' | null;
  onClose: () => void;
  onSave: (input: MorePageItemInput) => Promise<void>;
};

export function MorePageItemModal({ state, onClose, onSave }: Props) {
  const toast = useToast();
  const initial = state && state !== 'new' ? state : null;
  const [name, setName] = useState(initial?.name ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [instructionsText, setInstructionsText] = useState(
    (initial?.instructions ?? []).join('\n'),
  );
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state === 'new') {
      setName('');
      setImageUrl('');
      setDescription('');
      setInstructionsText('');
      setSortOrder(0);
      setIsActive(true);
      return;
    }
    setName(state.name);
    setImageUrl(state.imageUrl);
    setDescription(state.description);
    setInstructionsText((state.instructions ?? []).join('\n'));
    setSortOrder(state.sortOrder);
    setIsActive(state.isActive);
  }, [state]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const instructions = instructionsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    try {
      await notifyMutation(
        toast,
        () =>
          onSave({
            name: name.trim(),
            imageUrl,
            description: description.trim(),
            instructions: instructions.length ? instructions : null,
            sortOrder,
            isActive,
          }),
        {
          success:
            state === 'new' ? 'تم إضافة العنصر بنجاح' : 'تم تعديل العنصر بنجاح',
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
      title={state === 'new' ? 'إضافة عنصر' : 'تعديل عنصر'}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn"
            type="submit"
            form="more-item-form"
            disabled={busy}
          >
            حفظ
          </button>
        </>
      }
    >
      <form id="more-item-form" className="form" onSubmit={submit}>
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
              const res = await uploadMorePageItemFile(file);
              return res.imageUrl;
            }}
          />
        </label>
        <label>
          الوصف
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </label>
        <label>
          التعليمات (سطر لكل خطوة — اختياري)
          <textarea
            value={instructionsText}
            onChange={(e) => setInstructionsText(e.target.value)}
            rows={4}
            placeholder={'الخطوة الأولى\nالخطوة الثانية'}
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
