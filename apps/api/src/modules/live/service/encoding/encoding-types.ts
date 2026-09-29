export type ComponentStatus = 'ok' | 'degraded' | 'missing' | 'error';

export type GpuStatus = {
  status: ComponentStatus;
  available: boolean;
  vendor: string | null;
  name: string | null;
  driver: string | null;
  detail: string;
};

export type EncoderStatus = {
  status: ComponentStatus;
  available: boolean;
  preferred: string | null;
  hardware: string[];
  software: string[];
  detail: string;
};

export type FfmpegStatus = {
  status: ComponentStatus;
  available: boolean;
  path: string | null;
  version: string | null;
  detail: string;
};

export type MistStatus = {
  status: ComponentStatus;
  available: boolean;
  url: string | null;
  detail: string;
};

export type EncodingRuntimeStatus = {
  checkedAt: string;
  gpu: GpuStatus;
  encoder: EncoderStatus;
  ffmpeg: FfmpegStatus;
  mistserver: MistStatus;
};
