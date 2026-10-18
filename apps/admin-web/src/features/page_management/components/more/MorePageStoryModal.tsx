'use client';

import { FormEvent, useEffect, useState } from 'react';
import { uploadMorePageStoryFile } from '@/features/page_management/api';
import type {
  MorePageStoryBlock,
  MorePageStoryInput,
  MorePageStoryVariant,
} from '@/features/page_management/types';
import { MORE_PAGE_STORY_VARIANT_LABELS } from '@/features/page_management/types';
import {
  ImageUploadField,
  Modal,
  notifyMutation,
  useToast,
} from '@/shared/ui';

type Props = {
  state: MorePageStoryBlock | 'new' | null;
  onClose: () => void;
  onSave: (input: MorePageStoryInput) => Promise<void>;
};

const VARIANTS = Object.keys(
  MORE_PAGE_STORY_VARIANT_LABELS,
) as MorePageStoryVariant[];

export function MorePageStoryModal({ state, onClose, onSave }: Props) {
  const toast = useToast();
  const initial = state && state !== 'new' ? state : null;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [variant, setVariant] = useState<MorePageStoryVariant>(
    (initial?.variant as MorePageStoryVariant) || 'section',
  );
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state === 'new') {
      setTitle('');
      setBody('');
      setImageUrl('');
      setVariant('section');
      setSortOrder(0);
      setIsActive(true);
      return;
    }
    setTitle(state.title ?? '');
    setBody(state.body);
    setImageUrl(state.imageUrl);
    setVariant((state.variant as MorePageStoryVariant) || 'section');
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
            title: title.trim() || null,
            body: body.trim(),
            imageUrl,
            variant,
            sortOrder,
            isActive,
          }),
        {
          success:
            state === 'new' ? 'تم إضافة المقطع بنجاح' : 'تم تعديل المقطع بنجاح',
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
      title={state === 'new' ? 'إضافة مقطع' : 'تعديل مقطع'}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn"
            type="submit"
            form="more-story-form"
            disabled={busy}
          >
            حفظ
          </button>
        </>
      }
    >
      <form id="more-story-form" className="form" onSubmit={submit}>
        <label>
          العنوان (اختياري)
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          النص
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            required
          />
        </label>
        <label>
          الصورة
          <ImageUploadField
            value={imageUrl}
            onChange={setImageUrl}
            onUpload={async (file) => {
              const res = await uploadMorePageStoryFile(file);
              return res.imageUrl;
            }}
          />
        </label>
        <label>
          النوع
          <select
            value={variant}
            onChange={(e) =>
              setVariant(e.target.value as MorePageStoryVariant)
            }
          >
            {VARIANTS.map((key) => (
              <option key={key} value={key}>
                {MORE_PAGE_STORY_VARIANT_LABELS[key]}
              </option>
            ))}
          </select>
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
