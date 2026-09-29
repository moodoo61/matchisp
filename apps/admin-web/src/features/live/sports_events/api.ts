import { api, apiUpload } from '@/lib/api';
import type {
  SportMatch,
  SportMatchInput,
  SportTeam,
  SportTeamInput,
  SportsEventsSettings,
} from './types';

export function listSportTeams() {
  return api<SportTeam[]>('/live/sports-events/teams');
}

export function createSportTeam(input: SportTeamInput) {
  return api<SportTeam>('/live/sports-events/teams', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateSportTeam(id: string, input: Partial<SportTeamInput>) {
  return api<SportTeam>(`/live/sports-events/teams/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteSportTeam(id: string) {
  return api<{ success: boolean }>(`/live/sports-events/teams/${id}`, {
    method: 'DELETE',
  });
}

export async function uploadSportTeamLogo(file: File) {
  const res = await apiUpload<{ logoUrl: string }>(
    '/live/sports-events/teams/upload',
    file,
  );
  return res.logoUrl;
}

export function listTodayMatches() {
  return api<SportMatch[]>('/live/sports-events/matches/today');
}

export function listSportMatchChannelOptions() {
  return api<Array<{ id: string; name: string; label: string }>>(
    '/live/sports-events/channel-options',
  );
}

export function createSportMatch(input: SportMatchInput) {
  return api<SportMatch>('/live/sports-events/matches', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateSportMatch(id: string, input: Partial<SportMatchInput>) {
  return api<SportMatch>(`/live/sports-events/matches/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteSportMatch(id: string) {
  return api<{ success: boolean }>(`/live/sports-events/matches/${id}`, {
    method: 'DELETE',
  });
}

export function getSportsEventsSettings() {
  return api<SportsEventsSettings>('/live/sports-events/settings');
}

export function updateSportsEventsSettings(
  input: Partial<SportsEventsSettings>,
) {
  return api<SportsEventsSettings>('/live/sports-events/settings', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
