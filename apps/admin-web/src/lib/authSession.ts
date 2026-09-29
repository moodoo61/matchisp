/**
 * جلسة المستخدم وصلاحياته في المتصفح.
 */
import type { AuthUser } from '@isp/shared';

const USER_KEY = 'isp_auth_user';
/** يُبث عند تغيّر المستخدم المخزَّن حتى تُحدَّث الصلاحيات في الواجهة */
export const AUTH_USER_CHANGED_EVENT = 'isp-auth-user-changed';

function emitAuthUserChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT));
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  emitAuthUserChanged();
}

export function clearAuthUser() {
  localStorage.removeItem(USER_KEY);
  emitAuthUserChanged();
}

export function getUserPermissions(): string[] {
  return getAuthUser()?.permissions ?? [];
}
