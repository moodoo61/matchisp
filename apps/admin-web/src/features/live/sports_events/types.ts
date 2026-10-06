export type SportTeamType = 'CLUB' | 'NATIONAL';

export type SportTeam = {
  id: string;
  name: string;
  type: SportTeamType;
  logoUrl: string | null;
  externalId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SportTeamInput = {
  name: string;
  type: SportTeamType;
  logoUrl?: string | null;
};

export type SportMatchChannel = {
  id: string;
  name: string;
  label: string;
};

export type SportMatchGoal = {
  minute: number | null;
  extraMinute: number | null;
  minuteLabel: string;
  player: string;
  assist: string | null;
  team: string;
  isHome: boolean;
  detail: string;
};

export type SportMatch = {
  id: string;
  tournament: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: string;
  channelId: string | null;
  externalId?: string | null;
  status?: string | null;
  homeGoals?: number | null;
  awayGoals?: number | null;
  channelLabels?: string[];
  goalsJson?: SportMatchGoal[] | null;
  homeTeam: SportTeam;
  awayTeam: SportTeam;
  channel: SportMatchChannel | null;
  createdAt: string;
  updatedAt: string;
};

export type SportMatchInput = {
  tournament: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: string;
  channelId: string;
};

export type SportsEventsAutoClearMode = 'all' | 'after_hours';

export type SportsEventsSettings = {
  enabled: boolean;
  title: string;
  timezone: string;
  autoClearEnabled: boolean;
  autoClearMode: SportsEventsAutoClearMode;
  autoClearAfterHours: number;
  lastFullClearAt?: string | null;
  externalSyncEnabled: boolean;
  externalSyncUrl: string;
  externalSyncGeneralEnabled: boolean;
  externalSyncGeneralIntervalMinutes: number;
  externalSyncGeneralIntervalSeconds: number;
  lastExternalSyncGeneralAt?: string | null;
  externalSyncLiveEnabled: boolean;
  externalSyncLiveIntervalMinutes: number;
  externalSyncLiveIntervalSeconds: number;
  lastExternalSyncLiveAt?: string | null;
  lastExternalSyncAt?: string | null;
};

export type ExternalSyncResult = {
  success: true;
  mode?: string;
  fetched: number;
  created: number;
  updated: number;
  removed: number;
  teamsCreated: number;
  unmatchedChannels: string[];
  syncedAt: string;
};

export const SPORT_TEAM_TYPE_LABELS: Record<SportTeamType, string> = {
  CLUB: 'نادي',
  NATIONAL: 'منتخب',
};

export const DEFAULT_EXTERNAL_MATCHES_URL =
  'https://to.zerolag.live/api/matches/today/';
