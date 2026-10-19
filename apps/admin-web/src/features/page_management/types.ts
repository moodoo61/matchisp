export type ImageAd = {
  id: string;
  name: string | null;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TextAd = {
  id: string;
  text: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ContactMethodType =
  | 'phone'
  | 'whatsapp'
  | 'email'
  | 'facebook'
  | 'tiktok'
  | 'twitter'
  | 'instagram'
  | 'youtube'
  | 'other';

export const CONTACT_METHOD_TYPE_LABELS: Record<ContactMethodType, string> = {
  phone: 'هاتف',
  whatsapp: 'واتساب',
  email: 'بريد',
  facebook: 'فيسبوك',
  tiktok: 'تيك توك',
  twitter: 'تويتر',
  instagram: 'إنستغرام',
  youtube: 'يوتيوب',
  other: 'أخرى',
};

export type ContactMethod = {
  id: string;
  contactType: ContactMethodType | string;
  displayName: string;
  value: string;
  notes: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StatusService = {
  id: string;
  name: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LoginPackage = {
  id: string;
  name: string;
  price: number;
  time: string;
  download: string;
  validity: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LoginService = {
  id: string;
  name: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ImageAdInput = {
  imageUrl: string;
  linkUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type TextAdInput = {
  text: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type ContactMethodInput = {
  contactType: ContactMethodType | string;
  displayName: string;
  value: string;
  notes?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type StatusServiceInput = {
  name: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type LoginPackageInput = {
  name: string;
  price: number;
  time: string;
  download: string;
  validity: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type LoginServiceInput = {
  name: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder?: number;
  isActive?: boolean;
};

/** ميزة خلفية — صفحة تسجيل الدخول */
export type LoginFeature = {
  id: string;
  title: string;
  icon: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LoginFeatureInput = {
  title: string;
  icon?: string;
  imageUrl: string;
  sortOrder?: number;
  isActive?: boolean;
};

/** خيار سرعة — قيمة domain في MikroTik */
export type SpeedOption = {
  id: string;
  name: string;
  value: string;
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SpeedOptionInput = {
  name: string;
  value: string;
  isDefault?: boolean;
  sortOrder?: number;
  isActive?: boolean;
};

/** إعدادات Hot Blocker — الحظر على الكوكي، القيم من السيرفر */
export type LoginSecuritySettings = {
  id: string;
  enabled: boolean;
  tryCount: number;
  blockMinutes: number;
  updatedAt: string;
};

export type LoginSecuritySettingsInput = {
  enabled?: boolean;
  tryCount?: number;
  blockMinutes?: number;
};

/** علامة صفحة الدخول — من العامة أو تخصيص مستقل */
export type LoginBrandSettings = {
  id: string;
  useCustom: boolean;
  name: string;
  logoUrl: string;
  logoAbsoluteUrl: string | null;
  updatedAt: string;
  resolved: {
    name: string;
    logoUrl: string;
    source: 'general' | 'custom';
  };
  general: {
    brandName: string;
    brandLogoUrl: string;
    brandLogoAbsoluteUrl: string | null;
  };
};

export type LoginBrandSettingsInput = {
  useCustom?: boolean;
  name?: string;
  logoUrl?: string;
};

/** مصادقة خارجية — الدخول كمشترك عبر خادم بعيد */
export type LoginExternalAuthSettings = {
  id: string;
  enabled: boolean;
  flowMode: 'credentials' | 'redirect' | string;
  remoteUrl: string;
  httpMethod: 'post' | 'get' | string;
  restBaseUrl: string;
  restUsername: string;
  hasRestPassword: boolean;
  linkLabel: string;
  sendMac: boolean;
  sendIp: boolean;
  sendUsername: boolean;
  sendLinkLogin: boolean;
  sendLinkOrig: boolean;
  sendError: boolean;
  updatedAt: string;
  publicLoginUrl?: string;
};

export type LoginExternalAuthSettingsInput = {
  enabled?: boolean;
  flowMode?: 'credentials' | 'redirect';
  remoteUrl?: string;
  httpMethod?: 'post' | 'get';
  restBaseUrl?: string;
  restUsername?: string;
  restPassword?: string;
  linkLabel?: string;
  sendMac?: boolean;
  sendIp?: boolean;
  sendUsername?: boolean;
  sendLinkLogin?: boolean;
  sendLinkOrig?: boolean;
  sendError?: boolean;
};

export type MorePageSettings = {
  id: string;
  heroTitle: string;
  heroSubtitle: string;
  itemsSectionTitle: string;
  itemsSectionSubtitle: string;
  aboutSectionTitle: string;
  aboutSectionSubtitle: string;
  storySectionTitle: string;
  storySectionSubtitle: string;
  footerText: string;
  updatedAt: string;
};

export type MorePageSettingsInput = {
  heroTitle?: string;
  heroSubtitle?: string;
  itemsSectionTitle?: string;
  itemsSectionSubtitle?: string;
  aboutSectionTitle?: string;
  aboutSectionSubtitle?: string;
  storySectionTitle?: string;
  storySectionSubtitle?: string;
  footerText?: string;
};

export type MorePageItem = {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  instructions: string[] | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MorePageItemInput = {
  name: string;
  imageUrl: string;
  description: string;
  instructions?: string[] | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type MorePageAboutIconKey = 'vision' | 'mission' | 'values' | 'custom';

export const MORE_PAGE_ABOUT_ICON_LABELS: Record<MorePageAboutIconKey, string> =
  {
    vision: 'رؤية',
    mission: 'مهمة',
    values: 'قيم',
    custom: 'مخصص',
  };

export type MorePageAboutCard = {
  id: string;
  title: string;
  body: string;
  iconKey: MorePageAboutIconKey | string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MorePageAboutInput = {
  title: string;
  body: string;
  iconKey?: MorePageAboutIconKey | string;
  sortOrder?: number;
  isActive?: boolean;
};

export type MorePageStoryVariant =
  | 'intro'
  | 'section'
  | 'highlight'
  | 'conclusion';

export const MORE_PAGE_STORY_VARIANT_LABELS: Record<
  MorePageStoryVariant,
  string
> = {
  intro: 'مقدمة',
  section: 'مقطع',
  highlight: 'تمييز',
  conclusion: 'خاتمة',
};

export type MorePageStoryBlock = {
  id: string;
  title: string | null;
  body: string;
  imageUrl: string;
  variant: MorePageStoryVariant | string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MorePageStoryInput = {
  title?: string | null;
  body: string;
  imageUrl: string;
  variant?: MorePageStoryVariant | string;
  sortOrder?: number;
  isActive?: boolean;
};
