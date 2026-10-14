'use client';

type Props = {
  value: string;
};

/**
 * يخفي رابط المصدر / الجهاز ويعرضه فقط عند تمرير المؤشر
 * (جدول القنوات وتبويب الأقسام).
 */
export function SourceRevealCell({ value }: Props) {
  const text = value.trim();
  if (!text || text === '—') {
    return <span className="muted">—</span>;
  }

  return (
    <span className="source-reveal" title="مرّر للإظهار">
      <span className="source-reveal-mask" aria-hidden>
        ••••••••
      </span>
      <span className="source-reveal-value" dir="ltr">
        {text}
      </span>
    </span>
  );
}
