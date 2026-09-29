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
    whepUrl: string;
  };
};

export type PublicLiveSection = {
  id: string;
  name: string;
  label: string;
  sortOrder: number;
  channels: PublicLiveChannel[];
};

export type ViewingPageSettings = {
  enabled: boolean;
  brandTitle: string;
  pageTitle: string;
  tagline: string;
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
  playback: { hlsUrl: string; whepUrl: string };
};

export type ViewingPageAdminSection = {
  id: string;
  name: string;
  label: string;
  sortOrder: number;
  channels: ViewingPageAdminChannel[];
};

export type ViewingPageChannelsResponse = {
  httpBase: string;
  sections: ViewingPageAdminSection[];
};

export type PublicSportMatchTeam = {
  id: string;
  name: string;
  type: 'CLUB' | 'NATIONAL';
  logoUrl: string | null;
};

export type PublicSportMatch = {
  id: string;
  tournament: string;
  kickoffAt: string;
  homeTeam: PublicSportMatchTeam;
  awayTeam: PublicSportMatchTeam;
  channel: { id: string; name: string; label: string };
};
