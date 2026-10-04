import { MatchScheduleButton } from './schedule/MatchScheduleButton';

type Props = {
  brandTitle: string;
  brandLogoUrl?: string | null;
  brandSubtitle?: string;
  showBrandTitle?: boolean;
  showBrandLogo?: boolean;
  showBrandSubtitle?: boolean;
  showMatchSchedule?: boolean;
  onSelectChannel?: (channelId: string) => void;
};

/** ترويسة منحوتة — شعار/اسم العلامة حسب إعدادات الإظهار */
export function ClientLiveHeader({
  brandTitle,
  brandLogoUrl,
  brandSubtitle = 'LIVE • HD',
  showBrandTitle = true,
  showBrandLogo = true,
  showBrandSubtitle = true,
  showMatchSchedule = true,
  onSelectChannel,
}: Props) {
  const title = brandTitle.trim();
  const subtitle = brandSubtitle.trim();
  const logo = brandLogoUrl?.trim() || null;
  const initial = title.slice(0, 1) || 'L';

  return (
    <header className="cl-header">
      <div className="cl-header-inner">
        <div className="cl-identity">
          {showBrandLogo ? (
            logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="cl-brand-logo" src={logo} alt="" />
            ) : (
              <span className="cl-monogram" aria-hidden>
                {initial}
                <span className="cl-monogram-shine" aria-hidden />
                <span className="cl-monogram-ring" aria-hidden />
              </span>
            )
          ) : null}

          {showBrandTitle ? (
            <div className="cl-brand-wrap">
              <p className="cl-brand">{title || '—'}</p>
              {showBrandSubtitle && subtitle ? (
                <p className="cl-brand-sub">{subtitle}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        {showMatchSchedule ? (
          <div className="cl-header-actions">
            <MatchScheduleButton onSelectChannel={onSelectChannel} />
          </div>
        ) : null}
      </div>
    </header>
  );
}
