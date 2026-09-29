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
