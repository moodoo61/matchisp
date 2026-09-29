export const AGENTS_PUBLIC_SETTINGS_META_KEY = 'agents.public_api.settings';

/** الحقول التي يمكن إرجاعها في /api/public/login/agents */
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
  /** تفعيل نقطة النهاية العامة */
  enabled: boolean;
  fields: AgentsPublicApiFields;
};

export const DEFAULT_AGENTS_PUBLIC_API_SETTINGS: AgentsPublicApiSettings = {
  enabled: true,
  fields: {
    name: true,
    region: true,
    address: true,
    shopName: false,
    phone: false,
    order: true,
    latitude: false,
    longitude: false,
  },
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
