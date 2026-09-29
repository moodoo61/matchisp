/** كتالوج قواعد الأقسام — كل قسم رئيسي = قاعدة مستقلة */
export type SectionDatabaseDef = {
  key: string;
  /** اسم القاعدة في PostgreSQL */
  dbName: string;
  /** متغير البيئة لـ DATABASE_URL */
  envKey: string;
  /** الاسم الظاهر عربي */
  label: string;
  description: string;
};

export const SECTION_DATABASES: readonly SectionDatabaseDef[] = [
  {
    key: 'core',
    dbName: 'db_core',
    envKey: 'DATABASE_URL_CORE',
    label: 'النواة',
    description: 'مصادقة، فريق، أدوار، تدقيق',
  },
  {
    key: 'network_pages',
    dbName: 'db_network_pages',
    envKey: 'DATABASE_URL_NETWORK_PAGES',
    label: 'إدارة الصفحة',
    description: 'تسجيل الدخول والحالة والسرعة',
  },
  {
    key: 'live',
    dbName: 'db_live',
    envKey: 'DATABASE_URL_LIVE',
    label: 'البث المباشر',
    description: 'القنوات والأحداث الرياضية',
  },
  {
    key: 'break',
    dbName: 'db_break',
    envKey: 'DATABASE_URL_BREAK',
    label: 'الاستراحة',
    description: 'قسم الاستراحة',
  },
  {
    key: 'comms',
    dbName: 'db_comms',
    envKey: 'DATABASE_URL_COMMS',
    label: 'الاتصالات المحلية',
    description: 'قسم الاتصالات',
  },
  {
    key: 'magazine',
    dbName: 'db_magazine',
    envKey: 'DATABASE_URL_MAGAZINE',
    label: 'المجلة',
    description: 'اشتراكات الشبكات',
  },
  {
    key: 'maintenance',
    dbName: 'db_maintenance',
    envKey: 'DATABASE_URL_MAINTENANCE',
    label: 'الصيانة',
    description: 'بلاغات الصيانة',
  },
  {
    key: 'partners',
    dbName: 'db_partners',
    envKey: 'DATABASE_URL_PARTNERS',
    label: 'الوكلاء',
    description: 'بيانات الوكلاء',
  },
  {
    key: 'inventory',
    dbName: 'db_inventory',
    envKey: 'DATABASE_URL_INVENTORY',
    label: 'المخازن',
    description: 'مشتريات ومخازن',
  },
  {
    key: 'orders',
    dbName: 'db_orders',
    envKey: 'DATABASE_URL_ORDERS',
    label: 'طلبات الكروت',
    description: 'قسم الطلبات',
  },
  {
    key: 'support',
    dbName: 'db_support',
    envKey: 'DATABASE_URL_SUPPORT',
    label: 'خدمة العملاء',
    description: 'قسم الدعم',
  },
  {
    key: 'expenses',
    dbName: 'db_expenses',
    envKey: 'DATABASE_URL_EXPENSES',
    label: 'النفقات',
    description: 'قسم النفقات',
  },
  {
    key: 'platform',
    dbName: 'db_platform',
    envKey: 'DATABASE_URL_PLATFORM',
    label: 'الأنظمة الخلفية',
    description: 'منصة خلفية',
  },
  {
    key: 'service_monitor',
    dbName: 'db_service_monitor',
    envKey: 'DATABASE_URL_SERVICE_MONITOR',
    label: 'مراقب خدمات',
    description: 'MistServer / LibreNMS / Asterisk',
  },
  {
    key: 'settings',
    dbName: 'db_settings',
    envKey: 'DATABASE_URL_SETTINGS',
    label: 'الإعدادات',
    description: 'إعدادات الأقراص وغيرها',
  },
  {
    key: 'network',
    dbName: 'db_network',
    envKey: 'DATABASE_URL_NETWORK',
    label: 'الشبكة',
    description: 'منافذ الشبكة والعنونة',
  },
] as const;

export function findSectionDatabase(
  key: string,
): SectionDatabaseDef | undefined {
  return SECTION_DATABASES.find((d) => d.key === key);
}

/** اسم ملف نسخة آمن: section_YYYYMMDD-HHMMSS.dump */
export const BACKUP_FILENAME_RE =
  /^[a-z0-9_]+_\d{8}-\d{6}\.dump$/;
