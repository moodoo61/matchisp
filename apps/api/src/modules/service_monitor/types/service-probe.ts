export type ServiceProbeStatus = 'ok' | 'degraded' | 'missing' | 'error';

export type ServiceProbeResult = {
  key: string;
  checkedAt: string;
  status: ServiceProbeStatus;
  available: boolean;
  url: string | null;
  detail: string;
  latencyMs: number | null;
};
