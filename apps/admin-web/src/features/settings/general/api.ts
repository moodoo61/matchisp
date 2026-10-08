import { api, apiUpload, getApiBase } from '@/lib/api';
import type {
  GeneralSettings,
  GeneralUiFontOption,
  GeneralUiTheme,
} from './types';

export function getGeneralSettings() {
  return api<GeneralSettings>('/settings/general');
}

export function updateGeneralSettings(body: {
  systemName?: string;
  logoUrl?: string;
  brandName?: string;
  brandLogoUrl?: string;
  uiFontId?: string;
}) {
  return api<GeneralSettings>('/settings/general', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function listGeneralFonts() {
  return api<GeneralUiFontOption[]>('/settings/general/fonts');
}

export function downloadGeneralFont(fontId: string) {
  return api<{
    id: string;
    family: string;
    localReady: boolean;
    faces: GeneralSettings['uiFontFaces'];
  }>(`/settings/general/fonts/${encodeURIComponent(fontId)}/download`, {
    method: 'POST',
  });
}

/** عام — بدون توكن — لتطبيق الخط على صفحة الدخول */
export async function getGeneralUiTheme(): Promise<GeneralUiTheme> {
  const res = await fetch(`${getApiBase()}/api/settings/general/ui-theme`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('تعذر جلب ثيم الواجهة');
  }
  return res.json() as Promise<GeneralUiTheme>;
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
