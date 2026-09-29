export type MonitoredServiceKey = 'mistserver' | 'librenms' | 'asterisk';

export type MonitoredService = {
  id: string;
  key: MonitoredServiceKey;
  label: string;
  description: string;
  baseUrl: string;
  isEnabled: boolean;
  notes: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type MonitoredServiceInput = {
  label?: string;
  description?: string;
  baseUrl?: string;
  isEnabled?: boolean;
  notes?: string;
  sortOrder?: number;
};

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

export const SERVICE_META: Record<
  MonitoredServiceKey,
  { title: string; subtitle: string }
> = {
  mistserver: {
    title: 'MistServer',
    subtitle: 'خادم البث المباشر',
  },
  librenms: {
    title: 'LibreNMS',
    subtitle: 'خادم المراقبة',
  },
  asterisk: {
    title: 'Asterisk',
    subtitle: 'خادم الاتصالات',
  },
};
