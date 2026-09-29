'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTokens, clearTokens, api } from '@/lib/api';
import { clearAuthUser, setAuthUser } from '@/lib/authSession';
import type { AuthUser } from '@isp/shared';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!getTokens()) {
        clearAuthUser();
        router.replace('/login');
        return;
      }

      try {
        // دائماً نحدّث الصلاحيات من الخادم (أدوار/صلاحيات قد تتغيّر بعد الـ seed)
        const me = await api<AuthUser>('/auth/me');
        if (!cancelled) setAuthUser(me);
      } catch {
        clearTokens();
        clearAuthUser();
        router.replace('/login');
        return;
      }

      if (!cancelled) setReady(true);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
