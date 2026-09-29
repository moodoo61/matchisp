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
