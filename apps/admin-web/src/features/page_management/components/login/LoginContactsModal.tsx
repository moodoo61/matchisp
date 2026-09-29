'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createContactMethod,
  updateContactMethod,
} from '@/features/page_management/api';
import type {
  ContactMethod,
  ContactMethodInput,
  ContactMethodType,
} from '@/features/page_management/types';
import { CONTACT_METHOD_TYPE_LABELS } from '@/features/page_management/types';
import { Modal, notifyMutation, useToast } from '@/shared/ui';

type Props = {
  state: ContactMethod | 'new' | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

const TYPE_OPTIONS = Object.keys(
  CONTACT_METHOD_TYPE_LABELS,
) as ContactMethodType[];

export function LoginContactsModal({ state, onClose, onSaved }: Props) {
  const toast = useToast();
  const [contactType, setContactType] = useState<ContactMethodType>('phone');
  const [displayName, setDisplayName] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state === 'new') {
      setContactType('phone');
      setDisplayName(CONTACT_METHOD_TYPE_LABELS.phone);
      setValue('');
      setNotes('');
      setSortOrder(0);
      setIsActive(true);
      return;
    }
    setContactType(
      (state.contactType as ContactMethodType) in CONTACT_METHOD_TYPE_LABELS
        ? (state.contactType as ContactMethodType)
        : 'other',
    );
    setDisplayName(state.displayName);
    setValue(state.value);
    setNotes(state.notes ?? '');
    setSortOrder(state.sortOrder);
    setIsActive(state.isActive);
  }, [state]);

  function onTypeChange(next: ContactMethodType) {
    setContactType(next);
    // إن كان العنوان فارغاً أو مطابقاً لتسمية النوع السابق، حدّثه تلقائياً
    const prevLabel = CONTACT_METHOD_TYPE_LABELS[contactType];
    if (!displayName.trim() || displayName.trim() === prevLabel) {
      setDisplayName(CONTACT_METHOD_TYPE_LABELS[next]);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const input: ContactMethodInput = {
        contactType,
        displayName: displayName.trim(),
        value: value.trim(),
        notes: notes.trim(),
        sortOrder,
        isActive,
      };
      await notifyMutation(
        toast,
        async () => {
          if (state === 'new') await createContactMethod(input);
          else if (state) await updateContactMethod(state.id, input);
        },
        {
          success:
            state === 'new'
              ? 'تمت إضافة طريقة التواصل'
              : 'تم تعديل طريقة التواصل',
        },
      );
      onClose();
      await onSaved();
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={!!state}
      title={state === 'new' ? 'إضافة طريقة تواصل' : 'تعديل طريقة تواصل'}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn"
            type="submit"
            form="contact-method-form"
            disabled={busy}
          >
            حفظ
          </button>
        </>
      }
    >
      <form id="contact-method-form" className="form" onSubmit={submit}>
        <label>
          النوع
          <select
            value={contactType}
            onChange={(e) => onTypeChange(e.target.value as ContactMethodType)}
            required
          >
            {TYPE_OPTIONS.map((key) => (
              <option key={key} value={key}>
                {CONTACT_METHOD_TYPE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
        <label>
          العنوان الظاهر
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            placeholder="مثال: رقم الإدارة"
          />
        </label>
        <label>
          القيمة
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            placeholder="رقم / بريد / رابط"
          />
        </label>
        <label>
          ملاحظات (اختياري)
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="نص إضافي يظهر تحت العنوان"
          />
        </label>
        <label>
          الترتيب
          <input
            type="number"
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
