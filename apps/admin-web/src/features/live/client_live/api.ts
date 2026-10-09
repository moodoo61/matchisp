import { api } from '@/lib/api';
import type {
  PublicChannelPlaybackReady,
  PublicLiveChannel,
  PublicLiveSection,
  PublicSportMatch,
  ViewingPageChannelsResponse,
  ViewingPageSettings,
  ViewingPageSettingsInput,
} from './types';

/** جلب عام بدون اعتماد على جلسة لوحة التحكم */
async function publicFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message;
    throw new Error(message ?? 'تعذر التحميل');
  }
  return (await res.json()) as T;
}

export function getPublicViewingPageSettings() {
  return publicFetch<ViewingPageSettings>('/api/public/live/settings');
}

export function listPublicLiveChannels() {
  return publicFetch<PublicLiveChannel[]>('/api/public/live/channels');
}

export function listPublicLiveSections() {
  return publicFetch<PublicLiveSection[]>('/api/public/live/sections');
}

/** جاهزية قناة واحدة (online / جودات / روابط) أثناء إيقاظ Mist */
export function getPublicChannelPlaybackReady(channelId: string) {
  return publicFetch<PublicChannelPlaybackReady>(
    `/api/public/live/channels/${encodeURIComponent(channelId)}/playback-ready`,
  );
}

export function listPublicTodayMatches() {
  return publicFetch<PublicSportMatch[]>(
    '/api/public/live/sports-events/matches/today',
  );
}

/** إعدادات صفحة المشاهدة — لوحة التحكم */
export function getViewingPageSettings() {
  return api<ViewingPageSettings>('/live/viewing-page/settings');
}

export function updateViewingPageSettings(input: ViewingPageSettingsInput) {
  return api<ViewingPageSettings>('/live/viewing-page/settings', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function listViewingPageChannels() {
  return api<ViewingPageChannelsResponse>('/live/viewing-page/channels');
}

export function setViewingChannelVisibility(id: string, visible: boolean) {
  return api<{ id: string; visible: boolean; label: string }>(
    `/live/viewing-page/channels/${id}/visibility`,
    {
      method: 'PATCH',
      body: JSON.stringify({ visible }),
    },
  );
}
