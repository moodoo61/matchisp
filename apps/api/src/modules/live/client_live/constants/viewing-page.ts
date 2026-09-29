/** مفتاح إعدادات صفحة المشاهدة العامة (client_live) */
export const VIEWING_PAGE_META_KEY = 'client_live.viewing_page';

export type ViewingPageSettings = {
  /** تفعيل الصفحة العامة للزوار */
  enabled: boolean;
  /** اسم العلامة في أعلى الصفحة */
  brandTitle: string;
  /** عنوان الصفحة */
  pageTitle: string;
  /** جملة قصيرة تحت العنوان */
  tagline: string;
};

export const DEFAULT_VIEWING_PAGE_SETTINGS: ViewingPageSettings = {
  enabled: true,
  brandTitle: 'ISP Live',
  pageTitle: 'البث المباشر',
  tagline: 'قنواتك في مكان واحد، بجودة واضحة',
};
