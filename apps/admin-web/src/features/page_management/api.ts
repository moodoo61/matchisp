import { api, apiUpload } from '@/lib/api';
import type { PageCardFlag } from './cardFlags';
import type {
  ImageAd,
  ImageAdInput,
  ContactMethod,
  ContactMethodInput,
  LoginPackage,
  LoginPackageInput,
  LoginService,
  LoginServiceInput,
  MorePageAboutCard,
  MorePageAboutInput,
  MorePageItem,
  MorePageItemInput,
  MorePageSettings,
  MorePageSettingsInput,
  MorePageStoryBlock,
  MorePageStoryInput,
  StatusService,
  StatusServiceInput,
  TextAd,
  TextAdInput,
} from './types';

const loginBase = '/pages/login';
const statusBase = '/pages/status';
const moreBase = '/pages/more';

/** مسارات عامة لصفحات العملاء — تُعرض في لوحة الإدارة للنسخ */
export const PUBLIC_LOGIN_ENDPOINTS = {
  ads: '/api/public/login/ads',
  ticker: '/api/public/login/ticker',
  contacts: '/api/public/login/contacts',
  packages: '/api/public/login/packages',
  services: '/api/public/login/services',
} as const;

export const PUBLIC_STATUS_ENDPOINTS = {
  services: '/api/public/status/services',
} as const;

/** رابط الصفحة العامة لـ «ص المزيد» */
export const PUBLIC_MORE_PAGE_PATH = '/more';

export function listImageAds() {
  return api<ImageAd[]>(`${loginBase}/images`);
}

export function uploadImageAdFile(file: File) {
  return apiUpload<{ imageUrl: string }>(`${loginBase}/images/upload`, file);
}

export function createImageAd(input: ImageAdInput) {
  return api<ImageAd>(`${loginBase}/images`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateImageAd(id: string, input: Partial<ImageAdInput>) {
  return api<ImageAd>(`${loginBase}/images/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteImageAd(id: string) {
  return api<{ success: boolean }>(`${loginBase}/images/${id}`, {
    method: 'DELETE',
  });
}

export function listTextAds() {
  return api<TextAd[]>(`${loginBase}/text`);
}

export function createTextAd(input: TextAdInput) {
  return api<TextAd>(`${loginBase}/text`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTextAd(id: string, input: Partial<TextAdInput>) {
  return api<TextAd>(`${loginBase}/text/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteTextAd(id: string) {
  return api<{ success: boolean }>(`${loginBase}/text/${id}`, {
    method: 'DELETE',
  });
}

export function listContactMethods() {
  return api<ContactMethod[]>(`${loginBase}/contacts`);
}

export function createContactMethod(input: ContactMethodInput) {
  return api<ContactMethod>(`${loginBase}/contacts`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateContactMethod(
  id: string,
  input: Partial<ContactMethodInput>,
) {
  return api<ContactMethod>(`${loginBase}/contacts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteContactMethod(id: string) {
  return api<{ success: boolean }>(`${loginBase}/contacts/${id}`, {
    method: 'DELETE',
  });
}

export function listLoginPackages() {
  return api<LoginPackage[]>(`${loginBase}/packages`);
}

export function createLoginPackage(input: LoginPackageInput) {
  return api<LoginPackage>(`${loginBase}/packages`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateLoginPackage(
  id: string,
  input: Partial<LoginPackageInput>,
) {
  return api<LoginPackage>(`${loginBase}/packages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteLoginPackage(id: string) {
  return api<{ success: boolean }>(`${loginBase}/packages/${id}`, {
    method: 'DELETE',
  });
}

export function listLoginServices() {
  return api<LoginService[]>(`${loginBase}/services`);
}

export function uploadLoginServiceFile(file: File) {
  return apiUpload<{ imageUrl: string }>(`${loginBase}/services/upload`, file);
}

export function createLoginService(input: LoginServiceInput) {
  return api<LoginService>(`${loginBase}/services`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateLoginService(
  id: string,
  input: Partial<LoginServiceInput>,
) {
  return api<LoginService>(`${loginBase}/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteLoginService(id: string) {
  return api<{ success: boolean }>(`${loginBase}/services/${id}`, {
    method: 'DELETE',
  });
}

export function listStatusServices() {
  return api<StatusService[]>(`${statusBase}/services`);
}

export function uploadStatusServiceFile(file: File) {
  return apiUpload<{ imageUrl: string }>(
    `${statusBase}/services/upload`,
    file,
  );
}

export function createStatusService(input: StatusServiceInput) {
  return api<StatusService>(`${statusBase}/services`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateStatusService(
  id: string,
  input: Partial<StatusServiceInput>,
) {
  return api<StatusService>(`${statusBase}/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteStatusService(id: string) {
  return api<{ success: boolean }>(`${statusBase}/services/${id}`, {
    method: 'DELETE',
  });
}

export function getPageCardFlag(key: string) {
  return api<PageCardFlag>(`/pages/card-flags/${encodeURIComponent(key)}`);
}

export function updatePageCardFlag(key: string, isEnabled: boolean) {
  return api<PageCardFlag>(`/pages/card-flags/${encodeURIComponent(key)}`, {
    method: 'PATCH',
    body: JSON.stringify({ isEnabled }),
  });
}

export function getMorePageSettings() {
  return api<MorePageSettings>(`${moreBase}/settings`);
}

export function updateMorePageSettings(input: MorePageSettingsInput) {
  return api<MorePageSettings>(`${moreBase}/settings`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function listMorePageItems() {
  return api<MorePageItem[]>(`${moreBase}/items`);
}

export function uploadMorePageItemFile(file: File) {
  return apiUpload<{ imageUrl: string }>(`${moreBase}/items/upload`, file);
}

export function createMorePageItem(input: MorePageItemInput) {
  return api<MorePageItem>(`${moreBase}/items`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateMorePageItem(
  id: string,
  input: Partial<MorePageItemInput>,
) {
  return api<MorePageItem>(`${moreBase}/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteMorePageItem(id: string) {
  return api<{ success: boolean }>(`${moreBase}/items/${id}`, {
    method: 'DELETE',
  });
}

export function listMorePageAbout() {
  return api<MorePageAboutCard[]>(`${moreBase}/about`);
}

export function createMorePageAbout(input: MorePageAboutInput) {
  return api<MorePageAboutCard>(`${moreBase}/about`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateMorePageAbout(
  id: string,
  input: Partial<MorePageAboutInput>,
) {
  return api<MorePageAboutCard>(`${moreBase}/about/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteMorePageAbout(id: string) {
  return api<{ success: boolean }>(`${moreBase}/about/${id}`, {
    method: 'DELETE',
  });
}

export function listMorePageStory() {
  return api<MorePageStoryBlock[]>(`${moreBase}/story`);
}

export function uploadMorePageStoryFile(file: File) {
  return apiUpload<{ imageUrl: string }>(`${moreBase}/story/upload`, file);
}

export function createMorePageStory(input: MorePageStoryInput) {
  return api<MorePageStoryBlock>(`${moreBase}/story`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateMorePageStory(
  id: string,
  input: Partial<MorePageStoryInput>,
) {
  return api<MorePageStoryBlock>(`${moreBase}/story/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteMorePageStory(id: string) {
  return api<{ success: boolean }>(`${moreBase}/story/${id}`, {
    method: 'DELETE',
  });
}
