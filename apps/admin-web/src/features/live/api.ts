import { api, apiUpload } from '@/lib/api';
import type {
  Channel,
  ChannelInput,
  ChannelSection,
  ChannelsOverview,
  EncodingQualitySettingsView,
  EncodingQualityUpdateInput,
  EncodingRuntimeStatus,
  EncodingSettings,
  EncodingSourceOptionsResponse,
  HdmiCaptureDevice,
} from './types';

export function listChannelSections() {
  return api<ChannelSection[]>('/live/channel-sections');
}

export function createChannelSection(input: { name: string; label: string }) {
  return api<ChannelSection>('/live/channel-sections', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateChannelSection(
  id: string,
  input: { name?: string; label?: string; sortOrder?: number },
) {
  return api<ChannelSection>(`/live/channel-sections/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteChannelSection(id: string) {
  return api<{ success: boolean }>(`/live/channel-sections/${id}`, {
    method: 'DELETE',
  });
}

export function listChannels() {
  return api<Channel[]>('/live/channels');
}

export function getChannelsOverview() {
  return api<ChannelsOverview>('/live/channels/overview');
}

export function uploadChannelImage(file: File) {
  return apiUpload<{ imageUrl: string }>('/live/channels/upload', file);
}

export function createChannel(input: ChannelInput) {
  return api<Channel>('/live/channels', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateChannel(id: string, input: Partial<ChannelInput>) {
  return api<Channel>(`/live/channels/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteChannel(id: string) {
  return api<{ success: boolean }>(`/live/channels/${id}`, {
    method: 'DELETE',
  });
}

export function listHdmiDevices(exceptChannelId?: string) {
  const q = exceptChannelId
    ? `?exceptChannelId=${encodeURIComponent(exceptChannelId)}`
    : '';
  return api<HdmiCaptureDevice[]>(`/live/hdmi-devices${q}`);
}

export function stopChannelSessions(id: string) {
  return api<{ success: boolean; name: string }>(
    `/live/channels/${id}/stop-sessions`,
    { method: 'POST' },
  );
}

export function nukeChannelStream(id: string) {
  return api<{ success: boolean; name: string }>(
    `/live/channels/${id}/nuke-stream`,
    { method: 'POST' },
  );
}

export function getEncodingStatus() {
  return api<EncodingRuntimeStatus>('/live/encoding/status');
}

export function getEncodingSettings() {
  return api<EncodingSettings>('/live/encoding/settings');
}

export function listEncodingSourceOptions() {
  return api<EncodingSourceOptionsResponse>('/live/encoding/source-options');
}

export function getEncodingQuality() {
  return api<EncodingQualitySettingsView>('/live/encoding/quality');
}

export function updateEncodingQuality(input: EncodingQualityUpdateInput) {
  return api<EncodingQualitySettingsView>('/live/encoding/quality', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function updateEncodingSettings(input: {
  sourceMode: EncodingSettings['sourceMode'];
}) {
  return api<EncodingSettings>('/live/encoding/settings', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
