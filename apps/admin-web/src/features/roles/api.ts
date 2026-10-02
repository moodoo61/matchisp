import { api } from '@/lib/api';
import type { CreateRolePayload, RolePermission, RoleRow } from './types';

export function listRoles() {
  return api<RoleRow[]>('/roles');
}

export function listPermissions() {
  return api<RolePermission[]>('/roles/permissions');
}

export function createRole(payload: CreateRolePayload) {
  return api('/roles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
