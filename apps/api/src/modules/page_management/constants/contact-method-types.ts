/** أنواع طرق التواصل المتوافقة مع سكربت صفحة العميل */
export const CONTACT_METHOD_TYPES = [
  'phone',
  'whatsapp',
  'email',
  'facebook',
  'tiktok',
  'twitter',
  'instagram',
  'youtube',
  'other',
] as const;

export type ContactMethodType = (typeof CONTACT_METHOD_TYPES)[number];

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

export function isContactMethodType(value: string): value is ContactMethodType {
  return (CONTACT_METHOD_TYPES as readonly string[]).includes(value);
}
