export type ChannelType = 'IPTV' | 'HDMI';

export type ChannelSection = {
  id: string;
  /** معرّف إنجليزي فريد */
  name: string;
  /** اسم العرض */
  label: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: { channels: number };
};

export type MistStreamRuntime = {
  name: string;
  configured: boolean;
  /** 1=نشط، 2=غير نشط، 0=متوقف/غير متاح — «خطأ» يُعرض فقط إن وُجدت رسالة error */
  online: 0 | 1 | 2 | null;
  error: string | null;
  source: string | null;
  active: boolean;
  viewers: number;
  /** Connected — ثوانٍ من clients.conntime */
  connectedSec?: number | null;
  /** Data downloaded — بايت */
  downBytes?: number | null;
  /** Current bitrate — بايت/ث */
  downBps?: number | null;
};

export type Channel = {
  id: string;
  sectionId: string;
  section: { id: string; name: string; label: string };
  /** معرّف إنجليزي فريد */
  name: string;
  /** اسم العرض */
  label: string;
  type: ChannelType;
  sourceUrl: string | null;
  videoDevice: string | null;
  audioDevice: string | null;
  imageUrl: string | null;
  alwaysOn: boolean;
  sourceMode: EncodingSourceMode;
  qualityRungIds: string[];
  abrProfileKey: string | null;
  sortOrder: number;
  isActive: boolean;
  mist?: MistStreamRuntime;
  createdAt: string;
  updatedAt: string;
};

export type ChannelInput = {
  sectionId: string;
  name: string;
  label: string;
  type: ChannelType;
  sourceUrl?: string | null;
  videoDevice?: string | null;
  audioDevice?: string | null;
  imageUrl?: string | null;
  alwaysOn?: boolean;
  sourceMode?: EncodingSourceMode;
  qualityRungIds?: string[];
  /** مستويات HLS المختارة — أكثر من واحد يولّد master موحّد */
  hlsVariantUrls?: string[];
  sortOrder?: number;
};

export type ChannelSectionInput = {
  name: string;
  label: string;
};

export type HdmiCaptureDevice = {
  id: string;
  name: string;
  videoPath: string;
  audioPath: string | null;
  audioPaths: string[];
};

export type ComponentStatus = 'ok' | 'degraded' | 'missing' | 'error';

export type EncodingRuntimeStatus = {
  checkedAt: string;
  gpu: {
    status: ComponentStatus;
    available: boolean;
    vendor: string | null;
    name: string | null;
    driver: string | null;
    detail: string;
  };
  encoder: {
    status: ComponentStatus;
    available: boolean;
    preferred: string | null;
    hardware: string[];
    software: string[];
    detail: string;
  };
  ffmpeg: {
    status: ComponentStatus;
    available: boolean;
    path: string | null;
    version: string | null;
    detail: string;
  };
  mistserver: {
    status: ComponentStatus;
    available: boolean;
    url: string | null;
    detail: string;
  };
};

export type EncodingSourceMode =
  | 'passthrough'
  | 'passthrough_ffmpeg'
  | 'encode_cpu'
  | 'encode_gpu';

/** مستوى جودة من master HLS (مباشر ffmpeg) */
export type HlsVariant = {
  url: string;
  bandwidth: number | null;
  averageBandwidth: number | null;
  resolution: string | null;
  frameRate: number | null;
  name: string | null;
  label: string;
};

export type HlsProbeResult = {
  masterUrl: string;
  isMaster: boolean;
  variants: HlsVariant[];
};

export type EncodingSettings = {
  sourceMode: EncodingSourceMode;
  options: Array<{
    value: EncodingSourceMode;
    label: string;
    description: string;
    available: boolean;
  }>;
};

export type EncodingSourceOptionsResponse = {
  options: Array<{
    value: EncodingSourceMode;
    label: string;
    description: string;
    available: boolean;
  }>;
  defaultMode: EncodingSourceMode;
};

export type EncodingQualityRung = {
  id: string;
  label: string;
  enabled: boolean;
  width: number;
  height: number;
  bitrateKbps: number;
  maxrateKbps: number;
  bufsizeKbps: number;
};

export type EncodingQualitySettingsView = {
  fps: number;
  gop: number;
  audioBitrateKbps: number;
  audioSampleRate: number;
  nvencPreset: string;
  rungs: EncodingQualityRung[];
  scriptPath: string;
  configPath: string;
};

export type EncodingQualityUpdateInput = {
  rungs: Array<{
    id: string;
    enabled?: boolean;
    bitrateKbps: number;
    maxrateKbps: number;
    bufsizeKbps: number;
  }>;
};

export type ChannelsOverview = {
  checkedAt: string;
  mistserver: {
    status: 'ok' | 'error';
    available: boolean;
    url: string;
    detail: string;
  };
  activeChannels: number;
  totalChannels: number;
  viewers: number;
};
