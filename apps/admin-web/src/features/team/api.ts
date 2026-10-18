import { api } from '@/lib/api';
import type { TeamMember, TeamRoleOption } from './types';

export function listTeamMembers() {
  return api<TeamMember[]>('/team');
}

export function listTeamRoles() {
  return api<TeamRoleOption[]>('/roles');
}

export function createTeamMember(input: {
  name: string;
  username: string;
  password: string;
  roleIds: string[];
}) {
  return api<TeamMember>('/team', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTeamMember(
  id: string,
  input: {
    name?: string;
    password?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    roleIds?: string[];
  },
) {
  return api<TeamMember>(`/team/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteTeamMember(id: string) {
  return api<{ success: boolean }>(`/team/${id}`, {
    method: 'DELETE',
  });
}
