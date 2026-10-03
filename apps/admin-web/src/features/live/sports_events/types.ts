export type SportTeamType = 'CLUB' | 'NATIONAL';

export type SportTeam = {
  id: string;
  name: string;
  type: SportTeamType;
  logoUrl: string | null;
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

export type SportMatch = {
  id: string;
  tournament: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: string;
  channelId: string | null;
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
};

export const SPORT_TEAM_TYPE_LABELS: Record<SportTeamType, string> = {
  CLUB: 'نادي',
  NATIONAL: 'منتخب',
};
