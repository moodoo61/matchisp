'use client';

import type { HlsVariant } from '@/features/live/types';

type Props = {
  variants: HlsVariant[];
  selectedUrls: string[];
  busy?: boolean;
  error?: string | null;
  onAnalyze: () => void;
  onChangeSelected: (urls: string[]) => void;
};

/** مستويات HLS — قائمة بسيطة قابلة للتحديد المتعدد */
export function HlsVariantPicker({
  variants,
  selectedUrls,
  busy,
  error,
  onAnalyze,
  onChangeSelected,
}: Props) {
  const toggle = (url: string) => {
    if (selectedUrls.includes(url)) {
      if (selectedUrls.length <= 1) return;
      onChangeSelected(selectedUrls.filter((item) => item !== url));
      return;
    }
    onChangeSelected([...selectedUrls, url]);
  };

  return (
    <div className="hls-quality-field">
      <div className="field-row hls-quality-head">
        <span className="field-caption field-grow">مستويات الجودة</span>
        <button
          type="button"
          className="btn secondary"
          disabled={busy}
          onClick={onAnalyze}
        >
          {busy ? '…' : 'تحليل'}
        </button>
      </div>

      {variants.length > 0 ? (
        <ul className="hls-quality-list" aria-label="مستويات الجودة">
          {variants.map((variant) => {
            const on = selectedUrls.includes(variant.url);
            return (
              <li key={variant.url}>
                <button
                  type="button"
                  className={on ? 'hls-quality-row is-on' : 'hls-quality-row'}
                  disabled={busy || (on && selectedUrls.length <= 1)}
                  onClick={() => toggle(variant.url)}
                >
                  {variant.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">
          {busy ? 'جاري التحليل…' : 'اضغط «تحليل» لعرض المستويات'}
        </p>
      )}

      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
