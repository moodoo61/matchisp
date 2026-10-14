import { PERMISSIONS, type PermissionCode } from '@isp/shared';
import type { TransitionRole } from './assert-transition';

export function rolesFromPermissions(
  permissions: PermissionCode[] | string[],
): TransitionRole[] {
  const set = new Set(permissions);
  const roles: TransitionRole[] = [];
  if (
    set.has(PERMISSIONS.MAINTENANCE_TRIAGE) ||
    set.has(PERMISSIONS.MAINTENANCE_SUPERVISE)
  ) {
    roles.push('triage');
  }
  if (
    set.has(PERMISSIONS.MAINTENANCE_DISPATCH) ||
    set.has(PERMISSIONS.MAINTENANCE_SUPERVISE)
  ) {
    roles.push('dispatch');
  }
  if (
    set.has(PERMISSIONS.MAINTENANCE_EXECUTE) ||
    set.has(PERMISSIONS.MAINTENANCE_SUPERVISE)
  ) {
    roles.push('execute');
  }
  if (
    set.has(PERMISSIONS.MAINTENANCE_PARTS) ||
    set.has(PERMISSIONS.MAINTENANCE_SUPERVISE)
  ) {
    roles.push('parts');
  }
  if (set.has(PERMISSIONS.MAINTENANCE_SUPERVISE)) {
    roles.push('supervise');
  }
  return roles;
}
