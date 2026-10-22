'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  getDiscoverySettings,
  updateDiscoverySettings,
} from '@/features/comms/api';
import type { CommsDiscoverySettings } from '@/features/comms/types';
import { AndroidAppDownloadLink } from '@/features/comms/components/AndroidAppDownloadLink';
import { usePermissions } from '@/lib/usePermissions';
import { notifyMutation, useToast } from '@/shared/ui';

type Props = {
  refreshKey?: number;
};

export function CommsDiscoverySettingsCard({ refreshKey = 0 }: Props) {
  const { can } = usePermissions();
  const canUpdate = can(PERMISSIONS.COMMS_UPDATE);
  const toast = useToast();

  const [settings, setSettings] = useState<CommsDiscoverySettings | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [port, setPort] = useState(18760);
  const [displayName, setDisplayName] = useState('Match');
  const [showDownloadButton, setShowDownloadButton] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getDiscoverySettings();
      setSettings(next);
      setEnabled(next.enabled);
      setPort(next.port);
      setDisplayName(next.displayName);
      setShowDownloadButton(next.showDownloadButton !== false);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'تعذر تحميل إعدادات الاكتشاف',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canUpdate) return;
    setSaving(true);
    try {
      const next = await notifyMutation(
        toast,
        () =>
          updateDiscoverySettings({
            enabled,
            port,
            displayName: displayName.trim() || 'Match',
            showDownloadButton,
          }),
        { success: 'تم حفظ إعدادات الاكتشاف', error: 'تعذر الحفظ' },
      );
      setSettings(next);
      setEnabled(next.enabled);
      setPort(next.port);
      setDisplayName(next.displayName);
      setShowDownloadButton(next.showDownloadButton !== false);
    } catch {
      /* toast */
    } finally {
      setSaving(false);
    }
  }

  if (loading && !settings) {
    return <p className="muted">جارٍ التحميل…</p>;
  }

  const ports = settings?.allowedPorts?.length
    ? settings.allowedPorts
    : [18760, 18761, 18762, 18763, 18764, 18765, 18766, 18767, 18768, 18769];

  return (
    <div className="comms-discovery">
      {error ? <p className="error-text">{error}</p> : null}

      <p className="comms-discovery-hint">
        يعلن الخادم عن نفسه عبر UDP على منفذ واحد من القائمة. تطبيق الأندرويد
        يبحث في المنافذ <bdi className="comms-ltr-num">18760–18769</bdi> ويكتشف
        عنوان WebSocket على شبكة <bdi className="comms-ltr-num">172.*</bdi>{' '}
        عند توفرها.
      </p>

      <p
        className={[
          'comms-banner',
          settings?.listening ? 'is-ok' : settings?.enabled ? 'is-err' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {settings?.listening
          ? `الإعلان يعمل على UDP :${settings.port}`
          : settings?.enabled
            ? `الإعلان مفعّل لكن غير مستمع${settings.listenError ? `: ${settings.listenError}` : ''}`
            : 'الإعلان معطّل'}
      </p>

      <form className="comms-form" onSubmit={(e) => void onSave(e)}>
        <label className="comms-check">
          <input
            type="checkbox"
            checked={enabled}
            disabled={!canUpdate || saving}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          تفعيل إعلان الاكتشاف
        </label>

        <label className="comms-check">
          <input
            type="checkbox"
            checked={showDownloadButton}
            disabled={!canUpdate || saving}
            onChange={(e) => setShowDownloadButton(e.target.checked)}
          />
          عرض زر تحميل تطبيق الأندرويد
        </label>

        <label>
          منفذ الإعلان
          <select
            value={port}
            disabled={!canUpdate || saving}
            onChange={(e) => setPort(Number(e.target.value))}
            dir="ltr"
          >
            {ports.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label>
          اسم العرض
          <input
            value={displayName}
            disabled={!canUpdate || saving}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Match"
            maxLength={64}
          />
        </label>

        {canUpdate ? (
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'جارٍ الحفظ…' : 'حفظ'}
          </button>
        ) : null}
      </form>

      <div className="comms-download-row">
        <p className="muted" style={{ margin: 0 }}>
          {settings?.apkAvailable
            ? 'ملف التطبيق جاهز على الخادم.'
            : 'ملف الـ APK غير موجود بعد — ابنِه عبر سكربت البناء.'}
        </p>
        <AndroidAppDownloadLink />
      </div>
    </div>
  );
}
