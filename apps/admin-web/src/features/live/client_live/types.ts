export type TsQualityFromMist = {
  width: number;
  height: number | null;
  label: string;
};

export type PublicLiveChannel = {
  id: string;
  name: string;
  label: string;
  type: 'IPTV' | 'HDMI';
  imageUrl: string | null;
  sortOrder: number;
  section: { id: string; name: string; label: string; sortOrder: number };
  online: 0 | 1 | 2 | null;
  active: boolean;
  viewers: number;
  playback: {
    hlsUrl: string;
    tsUrl: string;
    whepUrl: string;
    token?: string | null;
    /** مسارات فيديو Mist للقناة */
    tsQualities?: TsQualityFromMist[];
  };
};

export type PublicLiveSection = {
  id: string;
  name: string;
  label: string;
  sortOrder: number;
  channels: PublicLiveChannel[];
};

/** استجابة جاهزية تشغيل قناة عامة */
export type PublicChannelPlaybackReady = {
  id: string;
  name: string;
  label: string;
  online: 0 | 1 | 2 | null;
  active: boolean;
  viewers: number;
  playback: PublicLiveChannel['playback'];
  tsReady: boolean;
};

export type ViewingPageSettings = {
  enabled: boolean;
  /** من الإعدادات العامة: brandName */
  brandTitle: string;
  /** من الإعدادات العامة: brandLogoUrl */
  brandLogoUrl: string;
  brandLogoAbsoluteUrl: string | null;
  showBrandTitle: boolean;
  showBrandLogo: boolean;
  brandSubtitle: string;
  showBrandSubtitle: boolean;
  liveBadgeText: string;
  showLiveBadge: boolean;
  pageTitle: string;
  tagline: string;
  showMatchSchedule: boolean;
  /** تشغيل القناة تلقائياً عند دخول الصفحة */
  autoplayOnEnter: boolean;
  /** حماية روابط المشاهدة بـ JWT/JWK عبر MistServer */
  jwtPlaybackEnabled: boolean;
  /** مشغّل TS (أولوية أولى) */
  playerTsEnabled: boolean;
  /** مشغّل HLS */
  playerHlsEnabled: boolean;
};

export type ViewingPageSettingsInput = Partial<ViewingPageSettings>;

export type ViewingPageAdminChannel = {
  id: string;
  name: string;
  label: string;
  type: 'IPTV' | 'HDMI';
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  visible: boolean;
  section: { id: string; name: string; label: string; sortOrder: number };
  online: 0 | 1 | 2 | null;
  active: boolean;
  viewers: number;
  playback: {
    hlsUrl: string;
    tsUrl: string;
    whepUrl: string;
    token?: string | null;
  };
};

export type ViewingPageAdminSection = {
  id: string;
  name: string;
  label: string;
  sortOrder: number;
  channels: ViewingPageAdminChannel[];
};

export type ViewingPageChannelsResponse = {
  /** فارغ = نفس مضيف صفحة المشغّل؛ وإلا عنوان Mist الصريح */
  httpBase: string;
  sections: ViewingPageAdminSection[];
};

export type PublicSportMatchTeam = {
  id: string;
  name: string;
  type: 'CLUB' | 'NATIONAL';
  logoUrl: string | null;
};

export type PublicSportMatchGoal = {
  minute: number | null;
  extraMinute: number | null;
  minuteLabel: string;
  player: string;
  assist: string | null;
  team: string;
  isHome: boolean;
  detail: string;
};

export type PublicSportMatchChannel = {
  id: string;
  name: string;
  label: string;
};

export type PublicSportMatch = {
  id: string;
  tournament: string;
  kickoffAt: string;
  status?: string | null;
  homeGoals?: number | null;
  awayGoals?: number | null;
  channelLabels?: string[];
  goals?: PublicSportMatchGoal[];
  homeTeam: PublicSportMatchTeam;
  awayTeam: PublicSportMatchTeam;
  channel: PublicSportMatchChannel | null;
  channels?: PublicSportMatchChannel[];
};
