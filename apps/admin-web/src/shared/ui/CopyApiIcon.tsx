'use client';

import { useMemo, useState } from 'react';
import { IconButton } from './IconButton';
import { IconCopy } from './icons';
import { Modal } from './Modal';

type Props = {
  path: string;
};

function resolveAbsoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  // نفس أصل لوحة الإدارة — /api يُمرَّر للـ Nest عبر rewrite
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${normalized}`;
  }
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (configured) return `${configured}${normalized}`;
  return normalized;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // نتابع للطريقة الاحتياطية (مثلاً على HTTP بدون secure context)
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '0';
    area.style.left = '0';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.focus();
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/** زر يفتح نافذة فيها رابط الـ API وزر نسخ */
export function CopyApiIcon({ path }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const absoluteUrl = useMemo(() => resolveAbsoluteUrl(path), [path]);

  async function copy() {
    setError(null);
    const ok = await copyText(absoluteUrl);
    if (!ok) {
      setError('تعذر النسخ تلقائياً — حدّد الرابط وانسخه يدوياً');
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <IconButton label={`رابط API: ${path}`} onClick={() => setOpen(true)}>
        <IconCopy />
      </IconButton>

      <Modal
        open={open}
        title="رابط نقطة الـ API"
        onClose={() => {
          setOpen(false);
          setCopied(false);
          setError(null);
        }}
        footer={
          <div className="modal-footer-actions">
            <button
              className="btn secondary"
              type="button"
              onClick={() => {
                setOpen(false);
                setCopied(false);
                setError(null);
              }}
            >
              إغلاق
            </button>
            <button className="btn" type="button" onClick={() => void copy()}>
              {copied ? 'تم النسخ' : 'نسخ الرابط'}
            </button>
          </div>
        }
      >
        <div className="form">
          <label>
            المسار
            <input value={path} readOnly />
          </label>
          <label>
            الرابط الكامل
            <input
              value={absoluteUrl}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
              dir="ltr"
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          {copied ? <p className="muted">تم نسخ الرابط إلى الحافظة.</p> : null}
        </div>
      </Modal>
    </>
  );
}
