export type ViewingReportsSettings = {
  enabled: boolean;
  handlerPath: string;
};

export type ViewingReportsSettingsInput = {
  enabled?: boolean;
};

export type ViewingSessionReport = {
  id: string;
  sessionId: string;
  streamName: string;
  channelLabel: string;
  connector: string;
  connectionAddress: string;
  durationSec: number;
  uploadedBytes: string;
  downloadedBytes: string;
  tags: string;
  endedAt: string;
  createdAt: string;
};

export type ViewingReportsSummary = {
  totalSessions: number;
  totalDurationSec: number;
  totalDownloadedBytes: string;
  byStream: Array<{
    streamName: string;
    channelLabel: string;
    sessions: number;
    durationSec: number;
    downloadedBytes: string;
  }>;
};

export type ViewingReportsDayRow = {
  day: string;
  sessions: number;
  durationSec: number;
  downloadedBytes: string;
  channels: number;
};

export type ViewingReportsTimeline = {
  bucket: 'hour' | 'day';
  points: Array<{ key: string; sessions: number }>;
};
