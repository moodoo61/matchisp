import { MatchScheduleButton } from './schedule/MatchScheduleButton';

type Props = {
  brandTitle: string;
  onSelectChannel?: (channelId: string) => void;
};

/** ترويسة منحوتة — مونوغرام محفور واسم بتدرج ذهبي */
export function ClientLiveHeader({ brandTitle, onSelectChannel }: Props) {
  const initial = brandTitle.trim().slice(0, 1) || 'L';

  return (
    <header className="cl-header">
      <div className="cl-header-inner">
        <div className="cl-identity">
          <span className="cl-monogram" aria-hidden>
            {initial}
            <span className="cl-monogram-shine" aria-hidden />
            <span className="cl-monogram-ring" aria-hidden />
          </span>
          <div className="cl-brand-wrap">
            <p className="cl-brand">{brandTitle}</p>
            <p className="cl-brand-sub">LIVE • HD</p>
          </div>
        </div>

        <div className="cl-header-actions">
          <MatchScheduleButton onSelectChannel={onSelectChannel} />
          <span className="cl-live-pill">
            <i aria-hidden />
            بث مباشر
          </span>
        </div>
      </div>
    </header>
  );
}
