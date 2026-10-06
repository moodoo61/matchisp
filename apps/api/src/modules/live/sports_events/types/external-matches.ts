export type ExternalMatchTeam = {
  id: number;
  name: string;
  logo_url?: string | null;
};

export type ExternalMatchGoal = {
  minute: number | null;
  extra_minute: number | null;
  minute_label: string;
  player: string;
  assist: string | null;
  team: string;
  is_home: boolean;
  detail: string;
};

export type ExternalMatchItem = {
  id: number;
  home_team: ExternalMatchTeam;
  away_team: ExternalMatchTeam;
  time?: string;
  league: string;
  status: string;
  date?: string;
  kickoff_at: string;
  home_goals: number | null;
  away_goals: number | null;
  channels: string[];
  goals: ExternalMatchGoal[];
};

export type ExternalMatchesResponse = {
  matches: ExternalMatchItem[];
};
