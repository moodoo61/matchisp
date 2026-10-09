/** مفتاح إعدادات صفحة المشاهدة العامة (client_live) */
export const VIEWING_PAGE_META_KEY = 'client_live.viewing_page';

export type ViewingPageSettings = {
  /** تفعيل الصفحة العامة للزوار */
  enabled: boolean;
  /** اسم العلامة من الإعدادات العامة (brandName) */
  brandTitle: string;
  /** شعار العلامة النسبي من الإعدادات العامة */
  brandLogoUrl: string;
  /** شعار العلامة كرابط مطلق للعرض */
  brandLogoAbsoluteUrl: string | null;
  /** إظهار اسم العلامة في صفحة العميل */
  showBrandTitle: boolean;
  /** إظهار شعار العلامة في صفحة العميل */
  showBrandLogo: boolean;
  /** العبارة تحت اسم العلامة (مثل LIVE • HD) */
  brandSubtitle: string;
  /** إظهار العبارة تحت اسم العلامة */
  showBrandSubtitle: boolean;
  /** نص شارة البث في الترويسة (مثل بث مباشر) */
  liveBadgeText: string;
  /** إظهار شارة البث */
  showLiveBadge: boolean;
  /** عنوان الصفحة */
  pageTitle: string;
  /** جملة قصيرة تحت العنوان */
  tagline: string;
  /** إظهار زر/جدول المباريات في صفحة العميل */
  showMatchSchedule: boolean;
  /** تشغيل القناة تلقائياً عند دخول الصفحة */
  autoplayOnEnter: boolean;
  /**
   * حماية روابط المشاهدة بـ JWK + JWT عبر MistServer.
   * false = روابط مفتوحة · true = يتطلب tkn
   * @see https://docs.mistserver.org/mistserver/integration/jwt/
   */
  jwtPlaybackEnabled: boolean;
  /** إظهار/تفعيل مشغّل TS (أولوية أولى عند التفعيل) */
  playerTsEnabled: boolean;
  /** إظهار/تفعيل مشغّل HLS */
  playerHlsEnabled: boolean;
};

export const DEFAULT_VIEWING_PAGE_SETTINGS: ViewingPageSettings = {
  enabled: true,
  brandTitle: '',
  brandLogoUrl: '',
  brandLogoAbsoluteUrl: null,
  showBrandTitle: true,
  showBrandLogo: true,
  brandSubtitle: 'LIVE • HD',
  showBrandSubtitle: true,
  liveBadgeText: 'بث مباشر',
  showLiveBadge: true,
  pageTitle: 'البث المباشر',
  tagline: 'قنواتك في مكان واحد، بجودة واضحة',
  showMatchSchedule: true,
  autoplayOnEnter: false,
  jwtPlaybackEnabled: false,
  playerTsEnabled: true,
  playerHlsEnabled: true,
};
