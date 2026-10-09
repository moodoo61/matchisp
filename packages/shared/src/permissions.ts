/** Permission codes: resource:action */
export const PERMISSIONS = {
  DASHBOARD_READ: 'dashboard:read',
  TEAM_READ: 'team:read',
  TEAM_CREATE: 'team:create',
  TEAM_UPDATE: 'team:update',
  TEAM_DELETE: 'team:delete',
  ROLES_READ: 'roles:read',
  ROLES_MANAGE: 'roles:manage',
  AUDIT_READ: 'audit:read',

  /** اختصار: أي عرض ضمن إدارة الصفحة */
  PAGE_MANAGEMENT_READ: 'page_management:read',
  /** اختصار: أي تعديل ضمن إدارة الصفحة */
  PAGE_MANAGEMENT_MANAGE: 'page_management:manage',

  PAGE_LOGIN_IMAGES_READ: 'page_management.login.images:read',
  /** اختصار: كل مهام إعلانات الصور */
  PAGE_LOGIN_IMAGES_MANAGE: 'page_management.login.images:manage',
  PAGE_LOGIN_IMAGES_CREATE: 'page_management.login.images:create',
  PAGE_LOGIN_IMAGES_UPDATE: 'page_management.login.images:update',
  PAGE_LOGIN_IMAGES_DELETE: 'page_management.login.images:delete',
  /** تفعيل/تعطيل إعلان أو البطاقة */
  PAGE_LOGIN_IMAGES_TOGGLE: 'page_management.login.images:toggle',

  PAGE_LOGIN_TICKER_READ: 'page_management.login.ticker:read',
  PAGE_LOGIN_TICKER_MANAGE: 'page_management.login.ticker:manage',
  PAGE_LOGIN_TICKER_CREATE: 'page_management.login.ticker:create',
  PAGE_LOGIN_TICKER_UPDATE: 'page_management.login.ticker:update',
  PAGE_LOGIN_TICKER_DELETE: 'page_management.login.ticker:delete',
  PAGE_LOGIN_TICKER_TOGGLE: 'page_management.login.ticker:toggle',

  PAGE_LOGIN_SERVICES_READ: 'page_management.login.services:read',
  PAGE_LOGIN_SERVICES_MANAGE: 'page_management.login.services:manage',
  PAGE_LOGIN_SERVICES_CREATE: 'page_management.login.services:create',
  PAGE_LOGIN_SERVICES_UPDATE: 'page_management.login.services:update',
  PAGE_LOGIN_SERVICES_DELETE: 'page_management.login.services:delete',
  PAGE_LOGIN_SERVICES_TOGGLE: 'page_management.login.services:toggle',

  PAGE_LOGIN_CONTACTS_READ: 'page_management.login.contacts:read',
  PAGE_LOGIN_CONTACTS_MANAGE: 'page_management.login.contacts:manage',
  PAGE_LOGIN_CONTACTS_CREATE: 'page_management.login.contacts:create',
  PAGE_LOGIN_CONTACTS_UPDATE: 'page_management.login.contacts:update',
  PAGE_LOGIN_CONTACTS_DELETE: 'page_management.login.contacts:delete',
  PAGE_LOGIN_CONTACTS_TOGGLE: 'page_management.login.contacts:toggle',

  PAGE_LOGIN_PACKAGES_READ: 'page_management.login.packages:read',
  PAGE_LOGIN_PACKAGES_MANAGE: 'page_management.login.packages:manage',
  PAGE_LOGIN_PACKAGES_CREATE: 'page_management.login.packages:create',
  PAGE_LOGIN_PACKAGES_UPDATE: 'page_management.login.packages:update',
  PAGE_LOGIN_PACKAGES_DELETE: 'page_management.login.packages:delete',
  PAGE_LOGIN_PACKAGES_TOGGLE: 'page_management.login.packages:toggle',

  PAGE_STATUS_SERVICES_READ: 'page_management.status.services:read',
  PAGE_STATUS_SERVICES_MANAGE: 'page_management.status.services:manage',
  PAGE_STATUS_SERVICES_CREATE: 'page_management.status.services:create',
  PAGE_STATUS_SERVICES_UPDATE: 'page_management.status.services:update',
  PAGE_STATUS_SERVICES_DELETE: 'page_management.status.services:delete',
  PAGE_STATUS_SERVICES_TOGGLE: 'page_management.status.services:toggle',

  PAGE_SPEED_READ: 'page_management.speed:read',
  PAGE_SPEED_MANAGE: 'page_management.speed:manage',
  PAGE_SPEED_UPDATE: 'page_management.speed:update',

  /** اختصار: أي عرض ضمن البث المباشر */
  LIVE_READ: 'live:read',
  /** اختصار: أي تعديل يدوي ضمن البث المباشر */
  LIVE_MANAGE: 'live:manage',

  LIVE_CHANNELS_READ: 'live.channels:read',
  /** اختصار: كل مهام القنوات اليدوية */
  LIVE_CHANNELS_MANAGE: 'live.channels:manage',
  LIVE_CHANNELS_CREATE: 'live.channels:create',
  LIVE_CHANNELS_UPDATE: 'live.channels:update',
  LIVE_CHANNELS_DELETE: 'live.channels:delete',
  /** تفعيل/تعطيل التشغيل الدائم */
  LIVE_CHANNELS_TOGGLE: 'live.channels:toggle',
  /** طرد الجلسات / الإيقاف القسري */
  LIVE_CHANNELS_CONTROL: 'live.channels:control',

  LIVE_VIEWING_PAGE_READ: 'live.viewing_page:read',
  /** اختصار: كل مهام صفحة المشاهدة اليدوية */
  LIVE_VIEWING_PAGE_MANAGE: 'live.viewing_page:manage',
  LIVE_VIEWING_PAGE_UPDATE: 'live.viewing_page:update',
  /** تفعيل/إيقاف الصفحة العامة + إظهار/إخفاء قناة */
  LIVE_VIEWING_PAGE_TOGGLE: 'live.viewing_page:toggle',

  LIVE_ENCODING_READ: 'live.encoding:read',
  /** اختصار: تعديل الجودة والترميز */
  LIVE_ENCODING_MANAGE: 'live.encoding:manage',
  LIVE_ENCODING_UPDATE: 'live.encoding:update',

  /** الأحداث الرياضية */
  LIVE_SPORTS_EVENTS_READ: 'live.sports_events:read',
  /** اختصار: كل مهام الأحداث الرياضية */
  LIVE_SPORTS_EVENTS_MANAGE: 'live.sports_events:manage',
  LIVE_SPORTS_EVENTS_CREATE: 'live.sports_events:create',
  LIVE_SPORTS_EVENTS_UPDATE: 'live.sports_events:update',
  LIVE_SPORTS_EVENTS_DELETE: 'live.sports_events:delete',

  /** تقارير المشاهدة (USER_END) */
  LIVE_VIEWING_REPORTS_READ: 'live.viewing_reports:read',
  LIVE_VIEWING_REPORTS_MANAGE: 'live.viewing_reports:manage',
  LIVE_VIEWING_REPORTS_UPDATE: 'live.viewing_reports:update',
  LIVE_VIEWING_REPORTS_DELETE: 'live.viewing_reports:delete',

  /** الوكلاء (قسم partners) */
  PARTNERS_READ: 'partners:read',
  PARTNERS_CREATE: 'partners:create',
  PARTNERS_UPDATE: 'partners:update',
  PARTNERS_DELETE: 'partners:delete',

  /** مراقب خدمات — متابعة MistServer / LibreNMS / Asterisk */
  SERVICE_MONITOR_READ: 'service_monitor:read',
  /** اختصار: كل مهام مراقب الخدمات */
  SERVICE_MONITOR_MANAGE: 'service_monitor:manage',
  SERVICE_MONITOR_UPDATE: 'service_monitor:update',

  /** الإعدادات */
  SETTINGS_READ: 'settings:read',
  SETTINGS_MANAGE: 'settings:manage',

  /** إعدادات عامة */
  SETTINGS_GENERAL_READ: 'settings.general:read',
  SETTINGS_GENERAL_MANAGE: 'settings.general:manage',
  SETTINGS_GENERAL_REBOOT: 'settings.general:reboot',
  SETTINGS_GENERAL_SHUTDOWN: 'settings.general:shutdown',

  /** إدارة الأقراص */
  SETTINGS_DISKS_READ: 'settings.disks:read',
  SETTINGS_DISKS_MANAGE: 'settings.disks:manage',
  SETTINGS_DISKS_MOUNT: 'settings.disks:mount',
  SETTINGS_DISKS_UNMOUNT: 'settings.disks:unmount',

  /** قواعد البيانات — نسخ احتياطي واستعادة */
  SETTINGS_DATABASES_READ: 'settings.databases:read',
  SETTINGS_DATABASES_MANAGE: 'settings.databases:manage',
  SETTINGS_DATABASES_BACKUP: 'settings.databases:backup',
  SETTINGS_DATABASES_RESTORE: 'settings.databases:restore',

  /** تحديث النظام من المستودع */
  SETTINGS_UPDATES_READ: 'settings.updates:read',
  SETTINGS_UPDATES_MANAGE: 'settings.updates:manage',
  SETTINGS_UPDATES_APPLY: 'settings.updates:apply',

  /** الشبكة — منافذ، عنونة، توجيه، DNS */
  NETWORK_READ: 'network:read',
  NETWORK_MANAGE: 'network:manage',
  NETWORK_INTERFACES_READ: 'network.interfaces:read',
  NETWORK_INTERFACES_MANAGE: 'network.interfaces:manage',
  NETWORK_ROUTES_READ: 'network.routes:read',
  NETWORK_ROUTES_MANAGE: 'network.routes:manage',
  NETWORK_DNS_READ: 'network.dns:read',
  NETWORK_DNS_MANAGE: 'network.dns:manage',
  NETWORK_SSTP_READ: 'network.sstp:read',
  NETWORK_SSTP_MANAGE: 'network.sstp:manage',
} as const;

export type PermissionCode =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionCode[] = Object.values(PERMISSIONS);

export const PERMISSION_LABELS: Record<PermissionCode, string> = {
  'dashboard:read': 'عرض لوحة النظرة العامة',
  'team:read': 'عرض الفريق',
  'team:create': 'إضافة عضو فريق',
  'team:update': 'تعديل عضو فريق',
  'team:delete': 'حذف عضو فريق',
  'roles:read': 'عرض الأدوار',
  'roles:manage': 'إدارة الأدوار والصلاحيات',
  'audit:read': 'عرض سجلات التدقيق',
  'page_management:read': 'عرض إدارة الصفحة (الكل)',
  'page_management:manage': 'تعديل إدارة الصفحة (الكل)',
  'page_management.login.images:read': 'عرض إعلانات الصور',
  'page_management.login.images:manage': 'إدارة إعلانات الصور (الكل)',
  'page_management.login.images:create': 'إضافة إعلان صورة',
  'page_management.login.images:update': 'تعديل إعلان صورة',
  'page_management.login.images:delete': 'حذف إعلان صورة',
  'page_management.login.images:toggle': 'تفعيل/تعطيل إعلان صورة',
  'page_management.login.ticker:read': 'عرض إعلان النص',
  'page_management.login.ticker:manage': 'إدارة إعلان النص (الكل)',
  'page_management.login.ticker:create': 'إضافة إعلان نص',
  'page_management.login.ticker:update': 'تعديل إعلان نص',
  'page_management.login.ticker:delete': 'حذف إعلان نص',
  'page_management.login.ticker:toggle': 'تفعيل/تعطيل إعلان نص',
  'page_management.login.services:read': 'عرض خدمات تسجيل الدخول',
  'page_management.login.services:manage': 'إدارة خدمات تسجيل الدخول (الكل)',
  'page_management.login.services:create': 'إضافة خدمة تسجيل دخول',
  'page_management.login.services:update': 'تعديل خدمة تسجيل دخول',
  'page_management.login.services:delete': 'حذف خدمة تسجيل دخول',
  'page_management.login.services:toggle': 'تفعيل/تعطيل خدمة تسجيل دخول',
  'page_management.login.contacts:read': 'عرض أرقام التواصل',
  'page_management.login.contacts:manage': 'إدارة أرقام التواصل (الكل)',
  'page_management.login.contacts:create': 'إضافة رقم تواصل',
  'page_management.login.contacts:update': 'تعديل رقم تواصل',
  'page_management.login.contacts:delete': 'حذف رقم تواصل',
  'page_management.login.contacts:toggle': 'تفعيل/تعطيل رقم تواصل',
  'page_management.login.packages:read': 'عرض الباقات',
  'page_management.login.packages:manage': 'إدارة الباقات (الكل)',
  'page_management.login.packages:create': 'إضافة باقة',
  'page_management.login.packages:update': 'تعديل باقة',
  'page_management.login.packages:delete': 'حذف باقة',
  'page_management.login.packages:toggle': 'تفعيل/تعطيل باقة',
  'page_management.status.services:read': 'عرض خدمات الحالة',
  'page_management.status.services:manage': 'إدارة خدمات الحالة (الكل)',
  'page_management.status.services:create': 'إضافة خدمة حالة',
  'page_management.status.services:update': 'تعديل خدمة حالة',
  'page_management.status.services:delete': 'حذف خدمة حالة',
  'page_management.status.services:toggle': 'تفعيل/تعطيل خدمة حالة',
  'page_management.speed:read': 'عرض خيارات السرعة',
  'page_management.speed:manage': 'إدارة خيارات السرعة (الكل)',
  'page_management.speed:update': 'تعديل خيارات السرعة',
  'live:read': 'عرض البث المباشر (الكل)',
  'live:manage': 'تعديل البث المباشر (الكل)',
  'live.channels:read': 'عرض قنوات البث',
  'live.channels:manage': 'إدارة قنوات البث (الكل)',
  'live.channels:create': 'إضافة قناة أو قسم',
  'live.channels:update': 'تعديل قناة أو قسم',
  'live.channels:delete': 'حذف قناة أو قسم',
  'live.channels:toggle': 'تفعيل/تعطيل التشغيل الدائم',
  'live.channels:control': 'طرد الجلسات والإيقاف القسري',
  'live.viewing_page:read': 'عرض صفحة المشاهدة',
  'live.viewing_page:manage': 'إدارة صفحة المشاهدة (الكل)',
  'live.viewing_page:update': 'تعديل إعدادات صفحة المشاهدة',
  'live.viewing_page:toggle': 'تفعيل الصفحة وإظهار/إخفاء القنوات',
  'live.encoding:read': 'عرض الجودة والترميز',
  'live.encoding:manage': 'إدارة الجودة والترميز (الكل)',
  'live.encoding:update': 'تعديل الجودة والترميز',
  'live.sports_events:read': 'عرض الأحداث الرياضية',
  'live.sports_events:manage': 'إدارة الأحداث الرياضية (الكل)',
  'live.sports_events:create': 'إضافة فريق أو مباراة',
  'live.sports_events:update': 'تعديل فريق أو مباراة أو الضبط',
  'live.sports_events:delete': 'حذف فريق أو مباراة',
  'live.viewing_reports:read': 'عرض تقارير المشاهدة',
  'live.viewing_reports:manage': 'إدارة تقارير المشاهدة (الكل)',
  'live.viewing_reports:update': 'تعديل إعدادات تقارير المشاهدة',
  'live.viewing_reports:delete': 'حذف سجلات تقارير المشاهدة',
  'partners:read': 'عرض الوكلاء',
  'partners:create': 'إضافة وكيل',
  'partners:update': 'تعديل وكيل',
  'partners:delete': 'حذف وكيل',
  'service_monitor:read': 'عرض مراقب الخدمات',
  'service_monitor:manage': 'إدارة مراقب الخدمات (الكل)',
  'service_monitor:update': 'تعديل إعدادات الخدمة المراقبة',
  'settings:read': 'عرض الإعدادات (الكل)',
  'settings:manage': 'إدارة الإعدادات (الكل)',
  'settings.general:read': 'عرض الإعدادات العامة',
  'settings.general:manage': 'تعديل الإعدادات العامة',
  'settings.general:reboot': 'إعادة تشغيل الجهاز',
  'settings.general:shutdown': 'إيقاف تشغيل الجهاز',
  'settings.disks:read': 'عرض إدارة الأقراص',
  'settings.disks:manage': 'إدارة الأقراص (ملاحظات وضبط)',
  'settings.disks:mount': 'تركيب قرص',
  'settings.disks:unmount': 'فصل قرص',
  'settings.databases:read': 'عرض قواعد البيانات والنسخ',
  'settings.databases:manage': 'حذف نسخ قواعد البيانات',
  'settings.databases:backup': 'إنشاء نسخة احتياطية لقاعدة',
  'settings.databases:restore': 'استعادة قاعدة من نسخة',
  'settings.updates:read': 'عرض حالة التحديث',
  'settings.updates:manage': 'إدارة التحديثات (الكل)',
  'settings.updates:apply': 'تنزيل وتطبيق التحديثات',
  'network:read': 'عرض الشبكة (الكل)',
  'network:manage': 'إدارة الشبكة (الكل)',
  'network.interfaces:read': 'عرض منافذ الشبكة',
  'network.interfaces:manage': 'إدارة المنافذ والعنونة',
  'network.routes:read': 'عرض جداول التوجيه',
  'network.routes:manage': 'تعديل التوجيه',
  'network.dns:read': 'عرض إعدادات DNS',
  'network.dns:manage': 'تعديل إعدادات DNS',
  'network.sstp:read': 'عرض اتصال SSTP',
  'network.sstp:manage': 'إدارة اتصال SSTP (حفظ/ربط/فصل)',
};

const LIVE_CHANNELS_WRITE_ACTIONS = new Set([
  'create',
  'update',
  'delete',
  'toggle',
  'control',
  'manage',
]);

const LIVE_ENCODING_WRITE_ACTIONS = new Set(['update', 'manage']);

const LIVE_VIEWING_WRITE_ACTIONS = new Set(['update', 'toggle', 'manage']);

const LIVE_SPORTS_WRITE_ACTIONS = new Set([
  'create',
  'update',
  'delete',
  'manage',
]);

const LIVE_VIEWING_REPORTS_WRITE_ACTIONS = new Set([
  'update',
  'delete',
  'manage',
]);

const PAGE_FEATURE_WRITE_ACTIONS = new Set([
  'create',
  'update',
  'delete',
  'toggle',
  'manage',
]);

/** هل يملك المستخدم الصلاحية المطلوبة (مع اختصارات القسم) */
export function hasPermission(
  userPermissions: readonly string[],
  required: string,
): boolean {
  if (typeof required !== 'string' || !required) return false;
  if (userPermissions.includes(required)) return true;

  if (required.endsWith(':read')) {
    const manageCode = required.replace(/:read$/, ':manage');
    if (userPermissions.includes(manageCode)) return true;
  }

  if (required.startsWith('page_management.')) {
    const colon = required.lastIndexOf(':');
    const resource = required.slice(0, colon);
    const action = required.slice(colon + 1);
    const manageCode = `${resource}:manage`;

    if (action === 'read') {
      return (
        userPermissions.includes(PERMISSIONS.PAGE_MANAGEMENT_READ) ||
        userPermissions.includes(PERMISSIONS.PAGE_MANAGEMENT_MANAGE) ||
        userPermissions.includes(manageCode)
      );
    }

    if (PAGE_FEATURE_WRITE_ACTIONS.has(action)) {
      if (userPermissions.includes(PERMISSIONS.PAGE_MANAGEMENT_MANAGE)) {
        return true;
      }
      if (action !== 'manage' && userPermissions.includes(manageCode)) {
        return true;
      }
    }
  }

  if (required.startsWith('live.channels:')) {
    const action = required.slice('live.channels:'.length);
    if (LIVE_CHANNELS_WRITE_ACTIONS.has(action)) {
      if (userPermissions.includes(PERMISSIONS.LIVE_CHANNELS_MANAGE)) return true;
      if (userPermissions.includes(PERMISSIONS.LIVE_MANAGE)) return true;
    }
    if (action === 'read') {
      return (
        userPermissions.includes(PERMISSIONS.LIVE_READ) ||
        userPermissions.includes(PERMISSIONS.LIVE_MANAGE) ||
        userPermissions.includes(PERMISSIONS.LIVE_CHANNELS_MANAGE)
      );
    }
  }

  if (required.startsWith('live.encoding:')) {
    const action = required.slice('live.encoding:'.length);
    if (LIVE_ENCODING_WRITE_ACTIONS.has(action)) {
      if (userPermissions.includes(PERMISSIONS.LIVE_ENCODING_MANAGE)) return true;
      if (userPermissions.includes(PERMISSIONS.LIVE_MANAGE)) return true;
    }
    if (action === 'read') {
      return (
        userPermissions.includes(PERMISSIONS.LIVE_READ) ||
        userPermissions.includes(PERMISSIONS.LIVE_MANAGE) ||
        userPermissions.includes(PERMISSIONS.LIVE_ENCODING_MANAGE)
      );
    }
  }

  if (required.startsWith('live.viewing_page:')) {
    const action = required.slice('live.viewing_page:'.length);
    if (LIVE_VIEWING_WRITE_ACTIONS.has(action)) {
      if (userPermissions.includes(PERMISSIONS.LIVE_VIEWING_PAGE_MANAGE)) {
        return true;
      }
      if (userPermissions.includes(PERMISSIONS.LIVE_MANAGE)) return true;
    }
    if (action === 'read') {
      return (
        userPermissions.includes(PERMISSIONS.LIVE_READ) ||
        userPermissions.includes(PERMISSIONS.LIVE_MANAGE) ||
        userPermissions.includes(PERMISSIONS.LIVE_VIEWING_PAGE_MANAGE)
      );
    }
  }

  if (required.startsWith('live.sports_events:')) {
    const action = required.slice('live.sports_events:'.length);
    if (LIVE_SPORTS_WRITE_ACTIONS.has(action)) {
      if (userPermissions.includes(PERMISSIONS.LIVE_SPORTS_EVENTS_MANAGE)) {
        return true;
      }
      if (userPermissions.includes(PERMISSIONS.LIVE_MANAGE)) return true;
    }
    if (action === 'read') {
      return (
        userPermissions.includes(PERMISSIONS.LIVE_READ) ||
        userPermissions.includes(PERMISSIONS.LIVE_MANAGE) ||
        userPermissions.includes(PERMISSIONS.LIVE_SPORTS_EVENTS_MANAGE)
      );
    }
  }

  if (required.startsWith('live.viewing_reports:')) {
    const action = required.slice('live.viewing_reports:'.length);
    if (LIVE_VIEWING_REPORTS_WRITE_ACTIONS.has(action)) {
      if (userPermissions.includes(PERMISSIONS.LIVE_VIEWING_REPORTS_MANAGE)) {
        return true;
      }
      if (userPermissions.includes(PERMISSIONS.LIVE_MANAGE)) return true;
    }
    if (action === 'read') {
      return (
        userPermissions.includes(PERMISSIONS.LIVE_READ) ||
        userPermissions.includes(PERMISSIONS.LIVE_MANAGE) ||
        userPermissions.includes(PERMISSIONS.LIVE_VIEWING_REPORTS_MANAGE)
      );
    }
  }

  if (required.startsWith('live.') && required.endsWith(':manage')) {
    return userPermissions.includes(PERMISSIONS.LIVE_MANAGE);
  }

  if (required.startsWith('live.') && required.endsWith(':read')) {
    return (
      userPermissions.includes(PERMISSIONS.LIVE_READ) ||
      userPermissions.includes(PERMISSIONS.LIVE_MANAGE)
    );
  }

  if (required.startsWith('service_monitor:')) {
    const action = required.slice('service_monitor:'.length);
    if (action === 'update' || action === 'manage') {
      return userPermissions.includes(PERMISSIONS.SERVICE_MONITOR_MANAGE);
    }
    if (action === 'read') {
      return (
        userPermissions.includes(PERMISSIONS.SERVICE_MONITOR_READ) ||
        userPermissions.includes(PERMISSIONS.SERVICE_MONITOR_MANAGE) ||
        userPermissions.includes(PERMISSIONS.SERVICE_MONITOR_UPDATE)
      );
    }
  }

  if (required.startsWith('settings.general:')) {
    const action = required.slice('settings.general:'.length);
    if (action === 'read') {
      return (
        userPermissions.includes(PERMISSIONS.SETTINGS_READ) ||
        userPermissions.includes(PERMISSIONS.SETTINGS_MANAGE) ||
        userPermissions.includes(PERMISSIONS.SETTINGS_GENERAL_MANAGE) ||
        userPermissions.includes(PERMISSIONS.SETTINGS_GENERAL_REBOOT) ||
        userPermissions.includes(PERMISSIONS.SETTINGS_GENERAL_SHUTDOWN)
      );
    }
    if (action === 'manage') {
      return userPermissions.includes(PERMISSIONS.SETTINGS_MANAGE);
    }
    if (action === 'reboot' || action === 'shutdown') {
      return userPermissions.includes(PERMISSIONS.SETTINGS_MANAGE);
    }
  }

  if (required.startsWith('settings.disks:')) {
    const action = required.slice('settings.disks:'.length);
    if (action === 'read') {
      return (
        userPermissions.includes(PERMISSIONS.SETTINGS_READ) ||
        userPermissions.includes(PERMISSIONS.SETTINGS_MANAGE) ||
        userPermissions.includes(PERMISSIONS.SETTINGS_DISKS_MANAGE) ||
        userPermissions.includes(PERMISSIONS.SETTINGS_DISKS_MOUNT) ||
        userPermissions.includes(PERMISSIONS.SETTINGS_DISKS_UNMOUNT)
      );
    }
    if (['manage', 'mount', 'unmount'].includes(action)) {
      return userPermissions.includes(PERMISSIONS.SETTINGS_MANAGE);
    }
  }

  if (required.startsWith('settings.databases:')) {
    const action = required.slice('settings.databases:'.length);
    if (action === 'read') {
      return (
        userPermissions.includes(PERMISSIONS.SETTINGS_READ) ||
        userPermissions.includes(PERMISSIONS.SETTINGS_MANAGE) ||
        userPermissions.includes(PERMISSIONS.SETTINGS_DATABASES_MANAGE) ||
        userPermissions.includes(PERMISSIONS.SETTINGS_DATABASES_BACKUP) ||
        userPermissions.includes(PERMISSIONS.SETTINGS_DATABASES_RESTORE)
      );
    }
    if (['manage', 'backup', 'restore'].includes(action)) {
      return userPermissions.includes(PERMISSIONS.SETTINGS_MANAGE);
    }
  }

  if (required.startsWith('settings.updates:')) {
    const action = required.slice('settings.updates:'.length);
    if (action === 'read') {
      return (
        userPermissions.includes(PERMISSIONS.SETTINGS_READ) ||
        userPermissions.includes(PERMISSIONS.SETTINGS_MANAGE) ||
        userPermissions.includes(PERMISSIONS.SETTINGS_UPDATES_MANAGE) ||
        userPermissions.includes(PERMISSIONS.SETTINGS_UPDATES_APPLY)
      );
    }
    if (action === 'apply' || action === 'manage') {
      return (
        userPermissions.includes(PERMISSIONS.SETTINGS_MANAGE) ||
        userPermissions.includes(PERMISSIONS.SETTINGS_UPDATES_MANAGE)
      );
    }
  }

  if (required.startsWith('network.interfaces:')) {
    const action = required.slice('network.interfaces:'.length);
    if (action === 'read') {
      return (
        userPermissions.includes(PERMISSIONS.NETWORK_READ) ||
        userPermissions.includes(PERMISSIONS.NETWORK_MANAGE) ||
        userPermissions.includes(PERMISSIONS.NETWORK_INTERFACES_MANAGE)
      );
    }
    if (action === 'manage') {
      return userPermissions.includes(PERMISSIONS.NETWORK_MANAGE);
    }
  }

  if (required.startsWith('network.routes:')) {
    const action = required.slice('network.routes:'.length);
    if (action === 'read') {
      return (
        userPermissions.includes(PERMISSIONS.NETWORK_READ) ||
        userPermissions.includes(PERMISSIONS.NETWORK_MANAGE) ||
        userPermissions.includes(PERMISSIONS.NETWORK_ROUTES_MANAGE)
      );
    }
    if (action === 'manage') {
      return userPermissions.includes(PERMISSIONS.NETWORK_MANAGE);
    }
  }

  if (required.startsWith('network.dns:')) {
    const action = required.slice('network.dns:'.length);
    if (action === 'read') {
      return (
        userPermissions.includes(PERMISSIONS.NETWORK_READ) ||
        userPermissions.includes(PERMISSIONS.NETWORK_MANAGE) ||
        userPermissions.includes(PERMISSIONS.NETWORK_DNS_MANAGE)
      );
    }
    if (action === 'manage') {
      return userPermissions.includes(PERMISSIONS.NETWORK_MANAGE);
    }
  }

  if (required.startsWith('network.sstp:')) {
    const action = required.slice('network.sstp:'.length);
    if (action === 'read') {
      return (
        userPermissions.includes(PERMISSIONS.NETWORK_READ) ||
        userPermissions.includes(PERMISSIONS.NETWORK_MANAGE) ||
        userPermissions.includes(PERMISSIONS.NETWORK_SSTP_MANAGE)
      );
    }
    if (action === 'manage') {
      return userPermissions.includes(PERMISSIONS.NETWORK_MANAGE);
    }
  }

  if (required.startsWith('network:') && required.endsWith(':manage')) {
    return userPermissions.includes(PERMISSIONS.NETWORK_MANAGE);
  }

  if (required.startsWith('network:') && required.endsWith(':read')) {
    return (
      userPermissions.includes(PERMISSIONS.NETWORK_READ) ||
      userPermissions.includes(PERMISSIONS.NETWORK_MANAGE)
    );
  }

  if (required.startsWith('settings:') && required.endsWith(':manage')) {
    return userPermissions.includes(PERMISSIONS.SETTINGS_MANAGE);
  }

  if (required.startsWith('settings:') && required.endsWith(':read')) {
    return (
      userPermissions.includes(PERMISSIONS.SETTINGS_READ) ||
      userPermissions.includes(PERMISSIONS.SETTINGS_MANAGE)
    );
  }

  return false;
}

export function hasAnyPermission(
  userPermissions: readonly string[],
  required: readonly string[],
): boolean {
  if (!Array.isArray(required) || !required.length) return false;
  return required.some(
    (code) => typeof code === 'string' && hasPermission(userPermissions, code),
  );
}

/** ربط مفتاح تفعيل البطاقة بصلاحية التفعيل/التعطيل */
export const PAGE_CARD_FLAG_MANAGE_PERMISSION: Record<string, PermissionCode> =
  {
    login_images: PERMISSIONS.PAGE_LOGIN_IMAGES_TOGGLE,
    login_ticker: PERMISSIONS.PAGE_LOGIN_TICKER_TOGGLE,
    login_services: PERMISSIONS.PAGE_LOGIN_SERVICES_TOGGLE,
    login_contacts: PERMISSIONS.PAGE_LOGIN_CONTACTS_TOGGLE,
    login_packages: PERMISSIONS.PAGE_LOGIN_PACKAGES_TOGGLE,
    status_services: PERMISSIONS.PAGE_STATUS_SERVICES_TOGGLE,
  };
