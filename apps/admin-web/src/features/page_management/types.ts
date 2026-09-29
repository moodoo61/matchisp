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
