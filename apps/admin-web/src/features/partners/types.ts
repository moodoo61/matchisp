export type Agent = {
  id: string;
  name: string;
  shopName: string;
  region: string;
  address: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  sortOrder: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AgentInput = {
  name: string;
  shopName: string;
  region: string;
  address: string;
  phone: string;
  latitude?: number | null;
  longitude?: number | null;
  sortOrder?: number;
  isPublic?: boolean;
};

export type Region = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type RegionInput = {
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  sortOrder?: number;
};

export type AgentsPublicApiFields = {
  name: boolean;
  region: boolean;
  address: boolean;
  shopName: boolean;
  phone: boolean;
  order: boolean;
  latitude: boolean;
  longitude: boolean;
};

export type AgentsPublicApiSettings = {
  enabled: boolean;
  fields: AgentsPublicApiFields;
};

export type AgentsMapsSettings = {
  googleMapsApiKey: string;
};

export const AGENTS_PUBLIC_FIELD_LABELS: Record<
  keyof AgentsPublicApiFields,
  string
> = {
  name: 'اسم الوكيل',
  region: 'المنطقة',
  address: 'العنوان',
  shopName: 'اسم المحل',
  phone: 'رقم الهاتف',
  order: 'الترتيب (order)',
  latitude: 'خط العرض',
  longitude: 'خط الطول',
};

export const PUBLIC_AGENTS_ENDPOINT = '/api/public/login/agents';

export function agentMapsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function regionCenter(
  region: Pick<Region, 'latitude' | 'longitude'> | null | undefined,
): { latitude: number; longitude: number } | null {
  if (
    !region ||
    typeof region.latitude !== 'number' ||
    typeof region.longitude !== 'number'
  ) {
    return null;
  }
  return { latitude: region.latitude, longitude: region.longitude };
}

/** تطبيع للمقارنة عند كشف التكرار */
export function normalizeAgentText(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function normalizeAgentPhone(value: string) {
  return value.replace(/[^\d+]/g, '');
}
