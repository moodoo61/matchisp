'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getPageCardFlag,
  updatePageCardFlag,
} from '@/features/page_management/api';
import type { PageCardFlagKey } from '@/features/page_management/cardFlags';

/** حالة تفعيل بطاقة + تبديلها */
export function useCardFlag(key: PageCardFlagKey) {
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const row = await getPageCardFlag(key);
      setEnabled(row.isEnabled);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }, [key]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggle = useCallback(async () => {
    setBusy(true);
    try {
      const next = !enabled;
      const row = await updatePageCardFlag(key, next);
      setEnabled(row.isEnabled);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    } finally {
      setBusy(false);
    }
  }, [enabled, key]);

  return { enabled, busy, error, toggle, reload };
}
