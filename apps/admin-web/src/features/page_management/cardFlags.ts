export const PAGE_CARD_FLAG_KEYS = [
  'login_images',
  'login_ticker',
  'login_services',
  'login_contacts',
  'login_packages',
  'status_services',
  'more_page',
  'more_page_items',
  'more_page_about',
  'more_page_story',
] as const;

export type PageCardFlagKey = (typeof PAGE_CARD_FLAG_KEYS)[number];

export type PageCardFlag = {
  key: PageCardFlagKey | string;
  isEnabled: boolean;
  updatedAt: string;
};
