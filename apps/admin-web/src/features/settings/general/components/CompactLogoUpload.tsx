'use client';

import { useRef, useState } from 'react';
import { IconUpload } from '@/shared/ui';

type Props = {
  value: string;
  previewUrl?: string | null;
  onUploaded: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  disabled?: boolean;
  accept?: string;
  emptyLabel?: string;
};

/** رفع شعار مضغوط: معاينة + زر رفع في سطر واحد */
export function CompactLogoUpload({
  value,
  previewUrl,
  onUploaded,
  onUpload,
  disabled = false,
  accept = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml',
  emptyLabel = 'لا يوجد',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const src = previewUrl || value;

  async function onFile(file: File | undefined) {
    if (!file || disabled) return;
    setBusy(true);
    setError(null);
    try {
      const url = await onUpload(file);
      onUploaded(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الرفع');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="general-logo-compact">
      <div className="general-logo-compact-row">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="general-logo-thumb" />
        ) : (
          <span className="general-logo-empty muted">{emptyLabel}</span>
        )}
        <button
          type="button"
          className="btn secondary"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? '…' : (
            <>
              <IconUpload />
              رفع
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
