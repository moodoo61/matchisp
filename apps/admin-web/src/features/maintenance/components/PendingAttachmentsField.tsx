'use client';

import { useEffect, useState } from 'react';

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  hint?: string;
};

function isImage(file: File) {
  return file.type.startsWith('image/');
}

function FileThumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage(file)) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        style={{
          width: 44,
          height: 44,
          objectFit: 'cover',
          borderRadius: 8,
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <span
      className="muted"
      style={{
        width: 44,
        height: 44,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 8,
        border: '1px solid var(--border)',
        fontSize: '0.7rem',
        flexShrink: 0,
      }}
    >
      PDF
    </span>
  );
}

/** اختيار صور/ملفات قبل الحفظ (تُرفع بعد إنشاء البلاغ) */
export function PendingAttachmentsField({
  files,
  onChange,
  disabled,
  hint = 'صور أو PDF — حتى 12MB لكل ملف',
}: Props) {
  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = [...files];
    for (const file of Array.from(list)) {
      const duplicate = next.some(
        (f) =>
          f.name === file.name &&
          f.size === file.size &&
          f.lastModified === file.lastModified,
      );
      if (!duplicate) next.push(file);
    }
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div style={{ display: 'grid', gap: '0.65rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <span className="muted" style={{ fontSize: '0.85rem' }}>
          {hint}
        </span>
        <label
          className="btn secondary"
          style={{
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          إرفاق ملف / صورة
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            multiple
            hidden
            disabled={disabled}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {files.length ? (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gap: '0.5rem',
          }}
        >
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${file.lastModified}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.45rem 0.55rem',
                border: '1px solid var(--border)',
                borderRadius: 10,
                background: 'var(--bg)',
              }}
            >
              <FileThumb file={file} />
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.88rem',
                }}
              >
                {file.name}
              </span>
              <button
                type="button"
                className="btn secondary"
                disabled={disabled}
                onClick={() => removeAt(index)}
              >
                إزالة
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          لا مرفقات بعد — اختر صوراً أو ملفات PDF
        </p>
      )}
    </div>
  );
}
