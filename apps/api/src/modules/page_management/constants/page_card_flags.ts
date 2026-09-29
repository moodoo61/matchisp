/** مفاتيح تفعيل/تعطيل البطاقات */
export const PAGE_CARD_FLAG_KEYS = [
  'login_images',
  'login_ticker',
  'login_services',
  'login_contacts',
  'login_packages',
  'status_services',
] as const;

export type PageCardFlagKey = (typeof PAGE_CARD_FLAG_KEYS)[number];
