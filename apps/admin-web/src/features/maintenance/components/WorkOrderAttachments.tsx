'use client';

import { useState } from 'react';
import { uploadWorkOrderAttachment } from '@/features/maintenance/api';
import type { WorkOrderAttachment } from '@/features/maintenance/types';
import { formatDt } from '@/features/maintenance/types';
import { useToast } from '@/shared/ui';

type Props = {
  workOrderId: string;
  attachments: WorkOrderAttachment[];
  canUpload: boolean;
  onUploaded: () => Promise<void>;
};

export function WorkOrderAttachments({
  workOrderId,
  attachments,
  canUpload,
  onUploaded,
}: Props) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadWorkOrderAttachment(workOrderId, file);
      }
      toast.success('تم رفع الصورة');
      await onUploaded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر الرفع');
    } finally {
      setUploading(false);
    }
  }

  return (
    <section style={{ marginTop: '1.25rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.5rem',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>الصور المرفقة</h3>
        {canUpload ? (
          <label className="btn secondary" style={{ cursor: 'pointer' }}>
            {uploading ? 'جاري الرفع…' : 'إرفاق صورة'}
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              disabled={uploading}
              onChange={(e) => {
                void onPick(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        ) : null}
      </div>
      {attachments.length ? (
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          لا توجد صور بعد
        </p>
      )}
    </section>
  );
}
