'use client';

type Props = {
  message: string;
  failed?: boolean;
};

/** حالة تنشيط القناة / تجهيز الجودة قبل تركيب المشغّل */
export function ChannelWakeOverlay({ message, failed = false }: Props) {
  return (
    <div
      className={
        failed ? 'cl-wake-overlay is-failed' : 'cl-wake-overlay is-waking'
      }
      role="status"
      aria-live="polite"
    >
      {!failed ? (
        <div className="cl-loading" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      ) : null}
      <p>{message}</p>
    </div>
  );
}
