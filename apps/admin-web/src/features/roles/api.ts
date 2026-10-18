import { api } from '@/lib/api';
import type {
  CreateRolePayload,
  RolePermission,
  RoleRow,
  UpdateRolePayload,
} from './types';

export function listRoles() {
  return api<RoleRow[]>('/roles');
}

export function listPermissions() {
  return api<RolePermission[]>('/roles/permissions');
}

export function createRole(payload: CreateRolePayload) {
  return api<RoleRow>('/roles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateRole(id: string, payload: UpdateRolePayload) {
  return api<RoleRow>(`/roles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteRole(id: string) {
  return api<{ success: boolean }>(`/roles/${id}`, {
    method: 'DELETE',
  });
}
