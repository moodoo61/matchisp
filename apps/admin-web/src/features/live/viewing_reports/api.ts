import { api } from '@/lib/api';
import type {
  ViewingReportsDayRow,
  ViewingReportsSettings,
  ViewingReportsSettingsInput,
  ViewingReportsSummary,
  ViewingReportsTimeline,
  ViewingSessionReport,
} from './types';

export function getViewingReportsSettings() {
  return api<ViewingReportsSettings>('/live/viewing-reports/settings');
}

export function updateViewingReportsSettings(input: ViewingReportsSettingsInput) {
  return api<ViewingReportsSettings>('/live/viewing-reports/settings', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function getViewingReportsSummary(hours = 24) {
  return api<ViewingReportsSummary>(
    `/live/viewing-reports/summary?hours=${hours}`,
  );
}

export function getViewingReportsByDay(hours = 24 * 30) {
  return api<{ days: ViewingReportsDayRow[] }>(
    `/live/viewing-reports/by-day?hours=${hours}`,
  );
}

export function getViewingReportsTimeline(hours = 24) {
  return api<ViewingReportsTimeline>(
    `/live/viewing-reports/timeline?hours=${hours}`,
  );
}

export function listViewingSessions(params?: {
  streamName?: string;
  day?: string;
  limit?: number;
  offset?: number;
}) {
  const q = new URLSearchParams();
  if (params?.streamName) q.set('streamName', params.streamName);
  if (params?.day) q.set('day', params.day);
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.offset != null) q.set('offset', String(params.offset));
  const qs = q.toString();
  return api<{ items: ViewingSessionReport[]; total: number }>(
    `/live/viewing-reports/sessions${qs ? `?${qs}` : ''}`,
  );
}

export function clearViewingSessions() {
  return api<{ deleted: number }>('/live/viewing-reports/sessions', {
    method: 'DELETE',
  });
}
