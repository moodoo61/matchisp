'use client';

import type { ToastItem } from './types';

type Props = {
  items: ToastItem[];
  onDismiss: (id: string) => void;
};

export function ToastViewport({ items, onDismiss }: Props) {
  if (!items.length) return null;

  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
      {items.map((item) => (
        <div
          key={item.id}
          className={`toast-card toast-${item.tone}`}
          role={item.tone === 'error' ? 'alert' : 'status'}
        >
          <div className="toast-body">
            {item.title ? <strong className="toast-title">{item.title}</strong> : null}
            <p className="toast-message">{item.message}</p>
          </div>
          <button
            type="button"
            className="toast-close"
            aria-label="إغلاق"
            onClick={() => onDismiss(item.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
