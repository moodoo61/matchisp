'use client';

import { useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  rebootHost,
  shutdownHost,
} from '@/features/settings/general/api';
import { usePermissions } from '@/lib/usePermissions';
import { TaskCard, notifyMutation, useToast } from '@/shared/ui';

export function GeneralPowerCard() {
  const { can } = usePermissions();
  const canReboot = can(PERMISSIONS.SETTINGS_GENERAL_REBOOT);
  const canShutdown = can(PERMISSIONS.SETTINGS_GENERAL_SHUTDOWN);
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (!canReboot && !canShutdown) return null;

  async function onReboot() {
    if (!canReboot) return;
    if (
      !confirm(
        'هل أنت متأكد من إعادة تشغيل الجهاز الآن؟ سيتم قطع الاتصال مؤقتاً.',
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await notifyMutation(toast, () => rebootHost(), {
        success: 'تم جدولة إعادة التشغيل خلال ثوانٍ',
        error: 'تعذر جدولة إعادة التشغيل',
      });
    } finally {
      setBusy(false);
    }
  }

  async function onShutdown() {
    if (!canShutdown) return;
    if (
      !confirm(
        'هل أنت متأكد من إيقاف تشغيل الجهاز؟ ستحتاج لتشغيله يدوياً لاحقاً.',
      )
    ) {
      return;
    }
    if (
      !confirm(
        'تأكيد أخير: إيقاف التشغيل سيُطفئ الخادم بالكامل. المتابعة؟',
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await notifyMutation(toast, () => shutdownHost(), {
        success: 'تم جدولة إيقاف التشغيل خلال ثوانٍ',
        error: 'تعذر جدولة إيقاف التشغيل',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <TaskCard title="الجهاز">
      <p className="muted general-power-hint">
        أوامر تؤثر على الخادم بالكامل. تأكد قبل التنفيذ.
      </p>
      <div className="general-power-actions">
        {canReboot ? (
          <button
            type="button"
            className="btn secondary"
            disabled={busy}
            onClick={() => void onReboot()}
          >
            إعادة تشغيل الجهاز
          </button>
        ) : null}
        {canShutdown ? (
          <button
            type="button"
            className="btn danger"
            disabled={busy}
            onClick={() => void onShutdown()}
          >
            إيقاف تشغيل الجهاز
          </button>
        ) : null}
      </div>
    </TaskCard>
  );
}
