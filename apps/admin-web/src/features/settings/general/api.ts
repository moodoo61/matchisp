import { api, apiUpload } from '@/lib/api';
import type { GeneralSettings } from './types';

export function getGeneralSettings() {
  return api<GeneralSettings>('/settings/general');
}

export function updateGeneralSettings(body: {
  systemName?: string;
  logoUrl?: string;
  brandName?: string;
  brandLogoUrl?: string;
}) {
  return api<GeneralSettings>('/settings/general', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function uploadGeneralLogo(file: File) {
  const res = await apiUpload<GeneralSettings>(
    '/settings/general/logo/upload',
    file,
  );
  return res.logoUrl;
}

export async function uploadGeneralBrandLogo(file: File) {
  const res = await apiUpload<GeneralSettings>(
    '/settings/general/brand-logo/upload',
    file,
  );
  return res.brandLogoUrl;
}

export type HostPowerResult = {
  success: boolean;
  action: 'reboot' | 'shutdown';
  message: string;
  delayMs: number;
};

export function rebootHost() {
  return api<HostPowerResult>('/settings/general/host/reboot', {
    method: 'POST',
  });
}

export function shutdownHost() {
  return api<HostPowerResult>('/settings/general/host/shutdown', {
    method: 'POST',
  });
}
