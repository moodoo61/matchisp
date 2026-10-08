'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPublicViewingPageSettings, listPublicLiveSections } from '../api';
import { useChannelKeyboard } from '../hooks/useChannelKeyboard';
import { compareBySortOrderThenLabel } from '../lib/naturalSort';
import type { PublicLiveSection, ViewingPageSettings } from '../types';
import { ClientLiveHeader } from './ClientLiveHeader';
import { ClientLiveStage } from './ClientLiveStage';
import { PlaylistPanel } from './playlist/PlaylistPanel';

const FALLBACK_SETTINGS: ViewingPageSettings = {
  enabled: true,
  brandTitle: '',
  brandLogoUrl: '',
  brandLogoAbsoluteUrl: null,
  showBrandTitle: true,
  showBrandLogo: true,
  brandSubtitle: 'LIVE • HD',
  showBrandSubtitle: true,
  liveBadgeText: 'بث مباشر',
  showLiveBadge: true,
  pageTitle: 'البث المباشر',
  tagline: '',
  showMatchSchedule: true,
  autoplayOnEnter: false,
  jwtPlaybackEnabled: false,
};

/** الهيكل المستقل الجديد — ترويسة دنيا + مسرح + قائمة جانبية */
export function ClientLivePublicView() {
  const [settings, setSettings] = useState<ViewingPageSettings>(FALLBACK_SETTINGS);
  const [sections, setSections] = useState<PublicLiveSection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** يزيد مع كل اختيار صريح لإعادة تهيئة المشغّل حتى لنفس القناة */
  const [playSession, setPlaySession] = useState(0);
  /** بعد ضغط المستخدم: تشغيل دائماً بغض النظر عن autoplayOnEnter */
  const [userStarted, setUserStarted] = useState(false);

  const reload = useCallback(async () => {
    try {
      const nextSettings = await getPublicViewingPageSettings();
      setSettings(nextSettings);
      if (!nextSettings.enabled) {
        setSections([]);
        setSelectedId(null);
        setError(null);
        return;
      }
      const list = await listPublicLiveSections();
      setSections(list);
      setError(null);
      const flat = [...list]
        .sort(compareBySortOrderThenLabel)
        .flatMap((section) =>
          [...section.channels].sort(compareBySortOrderThenLabel),
        );
      setSelectedId((current) => {
        if (current && flat.some((item) => item.id === current)) return current;
        return flat[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر التحميل');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), 20000);
    return () => window.clearInterval(timer);
  }, [reload]);

  const channels = useMemo(
    () =>
      [...sections]
        .sort(compareBySortOrderThenLabel)
        .flatMap((section) =>
          [...section.channels].sort(compareBySortOrderThenLabel),
        ),
    [sections],
  );
  const channelIds = useMemo(() => channels.map((item) => item.id), [channels]);
  const selected = useMemo(
    () => channels.find((item) => item.id === selectedId) ?? null,
    [channels, selectedId],
  );

  const selectChannel = useCallback((id: string) => {
    setSelectedId(id);
    setUserStarted(true);
    setPlaySession((n) => n + 1);
  }, []);

  useChannelKeyboard(channelIds, selectedId, selectChannel, settings.enabled && channels.length > 1);

  const shouldAutoplay = userStarted || settings.autoplayOnEnter;

  return (
    <div className="cl-app">
      <ClientLiveHeader
        brandTitle={settings.brandTitle}
        brandLogoUrl={settings.brandLogoAbsoluteUrl || settings.brandLogoUrl}
        brandSubtitle={settings.brandSubtitle}
        showBrandTitle={settings.showBrandTitle}
        showBrandLogo={settings.showBrandLogo}
        showBrandSubtitle={settings.showBrandSubtitle}
        showMatchSchedule={settings.showMatchSchedule}
        onSelectChannel={selectChannel}
      />

      <main className="cl-main">
        {!settings.enabled ? <p className="cl-message">البث غير متاح حالياً</p> : null}
        {settings.enabled && error ? <p className="cl-message is-error">{error}</p> : null}
        {settings.enabled && busy && !channels.length ? (
          <div className="cl-loading" aria-label="جاري التجهيز">
            <span />
            <span />
            <span />
          </div>
        ) : null}
        {settings.enabled && !busy && !channels.length && !error ? (
          <p className="cl-message">لا توجد قنوات متاحة حالياً</p>
        ) : null}

        {settings.enabled && selected ? (
          <div className="cl-layout">
            <ClientLiveStage
              key={`${selected.id}:${playSession}`}
              channel={selected}
              brandLogoUrl={
                settings.showBrandLogo
                  ? settings.brandLogoAbsoluteUrl || settings.brandLogoUrl
                  : null
              }
              autoplay={shouldAutoplay}
              onSelectChannel={selectChannel}
            />
            <PlaylistPanel sections={sections} selectedId={selectedId} onSelect={selectChannel} />
          </div>
        ) : null}
      </main>

      <footer className="cl-footer">
        {settings.showBrandTitle ? <p>{settings.brandTitle}</p> : <p />}
        <span>مشاهدة مباشرة</span>
      </footer>
    </div>
  );
}
