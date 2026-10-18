'use client';

import { FormEvent, useEffect, useState } from 'react';
import type {
  MorePageAboutCard,
  MorePageAboutIconKey,
  MorePageAboutInput,
} from '@/features/page_management/types';
import { MORE_PAGE_ABOUT_ICON_LABELS } from '@/features/page_management/types';
import { Modal, notifyMutation, useToast } from '@/shared/ui';

type Props = {
  state: MorePageAboutCard | 'new' | null;
  onClose: () => void;
  onSave: (input: MorePageAboutInput) => Promise<void>;
};

const ICON_KEYS = Object.keys(
  MORE_PAGE_ABOUT_ICON_LABELS,
) as MorePageAboutIconKey[];

export function MorePageAboutModal({ state, onClose, onSave }: Props) {
  const toast = useToast();
  const initial = state && state !== 'new' ? state : null;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [iconKey, setIconKey] = useState<MorePageAboutIconKey>(
    (initial?.iconKey as MorePageAboutIconKey) || 'custom',
  );
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state === 'new') {
      setTitle('');
      setBody('');
      setIconKey('custom');
      setSortOrder(0);
      setIsActive(true);
      return;
    }
    setTitle(state.title);
    setBody(state.body);
    setIconKey((state.iconKey as MorePageAboutIconKey) || 'custom');
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
            title: title.trim(),
            body: body.trim(),
            iconKey,
            sortOrder,
            isActive,
          }),
        {
          success:
            state === 'new' ? 'تم إضافة البطاقة بنجاح' : 'تم تعديل البطاقة بنجاح',
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
      title={state === 'new' ? 'إضافة بطاقة' : 'تعديل بطاقة'}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn"
            type="submit"
            form="more-about-form"
            disabled={busy}
          >
            حفظ
          </button>
        </>
      }
    >
      <form id="more-about-form" className="form" onSubmit={submit}>
        <label>
          العنوان
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label>
          النص
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            required
          />
        </label>
        <label>
          الأيقونة
          <select
            value={iconKey}
            onChange={(e) =>
              setIconKey(e.target.value as MorePageAboutIconKey)
            }
          >
            {ICON_KEYS.map((key) => (
              <option key={key} value={key}>
                {MORE_PAGE_ABOUT_ICON_LABELS[key]}
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
