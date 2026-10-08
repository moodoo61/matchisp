'use client';

import { useEffect } from 'react';
import { getGeneralUiTheme } from '@/features/settings/general/api';
import { applyUiFont } from '@/features/settings/general/lib/apply-ui-font';

/** يطبّق خط الواجهة المخزَّن محلياً على كامل لوحة الإدارة */
export function UiFontApplicator() {
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const theme = await getGeneralUiTheme();
        if (cancelled) return;
        applyUiFont({ family: theme.family, faces: theme.faces });
      } catch {
        // الإبقاء على الخط الاحتياطي في CSS
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
