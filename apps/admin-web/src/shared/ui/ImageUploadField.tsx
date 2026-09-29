'use client';

import { useRef, useState } from 'react';
import { IconUpload } from './icons';

type Props = {
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  accept?: string;
  /** هل الحقل إلزامي — افتراضي true للتوافق مع النماذج الحالية */
  required?: boolean;
};

/** حقل صورة مع زر رفع بالأيقونة */
export function ImageUploadField({
  value,
  onChange,
  onUpload,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  required = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الرفع');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="image-upload-field">
      <div className="image-upload-row">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="رابط الصورة أو ارفع ملفاً"
          required={required}
          readOnly={busy}
        />
        <button
          type="button"
          className="btn secondary icon-only"
          disabled={busy}
          title={busy ? 'جاري الرفع...' : 'رفع صورة'}
          aria-label={busy ? 'جاري الرفع...' : 'رفع صورة'}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? '…' : <IconUpload />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="image-upload-preview" />
      ) : null}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
