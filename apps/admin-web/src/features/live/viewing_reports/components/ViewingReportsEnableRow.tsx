'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  getViewingReportsSettings,
  updateViewingReportsSettings,
} from '@/features/live/viewing_reports/api';
import type { ViewingReportsSettings } from '@/features/live/viewing_reports/types';
import { usePermissions } from '@/lib/usePermissions';
import { CardEnableToggle, notifyMutation, useToast } from '@/shared/ui';

const EMPTY: ViewingReportsSettings = {
  enabled: false,
  handlerPath: '',
};

/** صف تفعيل تقارير المشاهدة — يُعرض داخل إعدادات صفحة المشاهدة */
export function ViewingReportsEnableRow() {
  const toast = useToast();
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.LIVE_VIEWING_REPORTS_READ);
  const canUpdate = can(PERMISSIONS.LIVE_VIEWING_REPORTS_UPDATE);
  const [form, setForm] = useState<ViewingReportsSettings>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const next = await getViewingReportsSettings();
      setForm(next);
    } catch {
      /* بطاقة الإعدادات الأم تعرض أخطاءها */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!canRead && !canUpdate) return;
    void reload();
  }, [canRead, canUpdate, reload]);

  const toggleEnabled = async () => {
    if (!canUpdate || busy) return;
    const nextEnabled = !form.enabled;
    setBusy(true);
    try {
      const next = await notifyMutation(
        toast,
        () => updateViewingReportsSettings({ enabled: nextEnabled }),
        {
          success: nextEnabled
            ? 'تم تفعيل تقارير المشاهدة'
            : 'تم تعطيل تقارير المشاهدة',
        },
      );
      setForm(next);
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  };

  if (!canRead && !canUpdate) return null;

  return (
    <div className="viewing-settings-row">
      <span className="viewing-settings-label">تقارير المشاهدة</span>
      <span className="viewing-settings-meta">
        {loaded
          ? form.enabled
            ? 'تسجيل جلسات USER_END'
            : 'معطّلة'
          : '…'}
      </span>
      <div className="viewing-settings-actions">
        {canUpdate ? (
          <CardEnableToggle
            enabled={form.enabled}
            busy={busy || !loaded}
            onToggle={() => void toggleEnabled()}
          />
        ) : (
          <span className="muted">{form.enabled ? 'مفعّل' : 'معطّل'}</span>
        )}
      </div>
    </div>
  );
}
