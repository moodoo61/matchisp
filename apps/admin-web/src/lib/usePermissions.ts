'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  hasAnyPermission,
  hasPermission,
  type PermissionCode,
} from '@isp/shared';
import {
  AUTH_USER_CHANGED_EVENT,
  getUserPermissions,
} from '@/lib/authSession';

export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setPermissions(getUserPermissions());
    sync();
    window.addEventListener(AUTH_USER_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_USER_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const can = useCallback(
    (code: PermissionCode | string) => hasPermission(permissions, code),
    [permissions],
  );

  const canAny = useCallback(
    (codes: readonly (PermissionCode | string)[]) =>
      hasAnyPermission(permissions, codes),
    [permissions],
  );

  return { permissions, can, canAny };
}
