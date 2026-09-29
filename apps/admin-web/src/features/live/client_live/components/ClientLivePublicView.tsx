'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPublicViewingPageSettings, listPublicLiveSections } from '../api';
import { useChannelKeyboard } from '../hooks/useChannelKeyboard';
import type { PublicLiveSection, ViewingPageSettings } from '../types';
import { ClientLiveHeader } from './ClientLiveHeader';
import { ClientLiveStage } from './ClientLiveStage';
import { PlaylistPanel } from './playlist/PlaylistPanel';

const FALLBACK_SETTINGS: ViewingPageSettings = {
  enabled: true,
  brandTitle: 'ISP Live',
  pageTitle: 'البث المباشر',
  tagline: '',
};

/** الهيكل المستقل الجديد — ترويسة دنيا + مسرح + قائمة جانبية */
export function ClientLivePublicView() {
  const [settings, setSettings] = useState<ViewingPageSettings>(FALLBACK_SETTINGS);
  const [sections, setSections] = useState<PublicLiveSection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      const flat = list.flatMap((section) => section.channels);
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

  const channels = useMemo(() => sections.flatMap((section) => section.channels), [sections]);
  const channelIds = useMemo(() => channels.map((item) => item.id), [channels]);
  const selected = useMemo(
    () => channels.find((item) => item.id === selectedId) ?? null,
    [channels, selectedId],
  );

  const selectChannel = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  useChannelKeyboard(channelIds, selectedId, selectChannel, settings.enabled && channels.length > 1);

  return (
    <div className="cl-app">
      <ClientLiveHeader
        brandTitle={settings.brandTitle}
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
            <ClientLiveStage channel={selected} />
            <PlaylistPanel sections={sections} selectedId={selectedId} onSelect={selectChannel} />
          </div>
        ) : null}
      </main>

      <footer className="cl-footer">
        <p>{settings.brandTitle}</p>
        <span>مشاهدة مباشرة</span>
      </footer>
    </div>
  );
}
