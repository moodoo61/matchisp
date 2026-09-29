import { api } from '@/lib/api';
import type {
  MonitoredService,
  MonitoredServiceInput,
  MonitoredServiceKey,
  ServiceProbeResult,
} from './types';

export function listMonitoredServices() {
  return api<MonitoredService[]>('/service-monitor/services');
}

export function getMonitoredService(key: MonitoredServiceKey) {
  return api<MonitoredService>(`/service-monitor/services/${key}`);
}

export function updateMonitoredService(
  key: MonitoredServiceKey,
  input: MonitoredServiceInput,
) {
  return api<MonitoredService>(`/service-monitor/services/${key}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function getMonitoredServiceStatus(key: MonitoredServiceKey) {
  return api<ServiceProbeResult>(`/service-monitor/services/${key}/status`);
}
