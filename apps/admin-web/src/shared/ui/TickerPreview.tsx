'use client';

type Props = {
  items: string[];
};

/** شريط معاينة يتحرك من اليسار → اليمين، عنصر لكل نص بدون تكرار */
export function TickerPreview({ items }: Props) {
  if (!items.length) return null;

  const totalChars = items.reduce((sum, t) => sum + t.length, 0);
  const durationSec = Math.min(
    72,
    Math.max(12, items.length * 6 + totalChars * 0.07),
  );

  return (
    <div
      className="ticker-preview compact"
      aria-label={`معاينة ${items.length} نص`}
    >
      <div
        className="ticker-track"
        style={{ animationDuration: `${durationSec}s` }}
      >
        {items.map((text, index) => (
          <span key={`${index}-${text.slice(0, 24)}`} className="ticker-chunk">
            {index > 0 ? (
              <span className="ticker-sep" aria-hidden>
                •
              </span>
            ) : null}
            <span className="ticker-item" dir="rtl">
              {text}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
