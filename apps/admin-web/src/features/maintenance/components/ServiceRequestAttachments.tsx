'use client';

import type { ServiceRequestAttachment } from '@/features/maintenance/types';
import { formatDt } from '@/features/maintenance/types';

type Props = {
  attachments: ServiceRequestAttachment[];
};

function isImageUrl(url: string, name: string) {
  const lower = `${url} ${name}`.toLowerCase();
  return /\.(jpe?g|png|webp|gif)(\?|$)/.test(lower);
}

/** عرض مرفقات بلاغ محفوظة */
export function ServiceRequestAttachments({ attachments }: Props) {
  if (!attachments.length) {
    return (
      <p className="muted" style={{ margin: 0 }}>
        لا مرفقات محفوظة على هذا البلاغ
      </p>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '0.65rem',
      }}
    >
      {attachments.map((a) => (
        <figure
          key={a.id}
          style={{
            margin: 0,
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'var(--bg)',
          }}
        >
          <a href={a.url} target="_blank" rel="noreferrer">
            {isImageUrl(a.url, a.originalName) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.url}
                alt={a.originalName}
                style={{
                  width: '100%',
                  aspectRatio: '4/3',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <div
                className="muted"
                style={{
                  aspectRatio: '4/3',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '0.85rem',
                }}
              >
                PDF
              </div>
            )}
          </a>
          <figcaption
            style={{
              padding: '0.4rem 0.5rem',
              fontSize: '0.75rem',
              color: 'var(--muted)',
            }}
          >
            {a.originalName}
            <br />
            {formatDt(a.createdAt)}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
