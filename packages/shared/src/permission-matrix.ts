/** إجراءات الصلاحية وترتيبها في مصفوفة الأدوار */
export const PERMISSION_ACTION_ORDER = [
  'read',
  'create',
  'update',
  'delete',
  'manage',
  'toggle',
  'control',
  'mount',
  'unmount',
  'backup',
  'restore',
  'apply',
  'reboot',
  'shutdown',
] as const;

export type PermissionAction = (typeof PERMISSION_ACTION_ORDER)[number];

export const PERMISSION_ACTION_LABELS: Record<PermissionAction, string> = {
  read: 'عرض',
  create: 'إضافة',
  update: 'تعديل',
  delete: 'حذف',
  manage: 'إدارة',
  toggle: 'تفعيل',
  control: 'تحكم',
  mount: 'تركيب',
  unmount: 'فصل',
  backup: 'نسخ',
  restore: 'استعادة',
  apply: 'تطبيق',
  reboot: 'إعادة تشغيل',
  shutdown: 'إيقاف',
};

/** اسم المورد المعروض في صف المصفوفة */
export const PERMISSION_RESOURCE_LABELS: Record<string, string> = {
  dashboard: 'نظرة عامة',
  team: 'الفريق',
  roles: 'الأدوار',
  audit: 'سجلات التدقيق',
  page_management: 'إدارة الصفحة (الكل)',
  'page_management.login.images': 'إعلانات الصور',
  'page_management.login.ticker': 'إعلان النص',
  'page_management.login.services': 'خدمات تسجيل الدخول',
  'page_management.login.contacts': 'أرقام التواصل',
  'page_management.login.packages': 'الباقات',
  'page_management.status.services': 'خدمات الحالة',
  'page_management.speed': 'خيارات السرعة',
  live: 'البث المباشر (الكل)',
  'live.channels': 'القنوات',
  'live.sports_events': 'الأحداث الرياضية',
  'live.viewing_page': 'صفحة المشاهدة',
  'live.encoding': 'الجودة والترميز',
  'live.viewing_reports': 'تقارير المشاهدة',
  partners: 'الوكلاء',
  service_monitor: 'مراقب الخدمات',
  settings: 'الإعدادات (الكل)',
  'settings.general': 'عامة',
  'settings.disks': 'إدارة الأقراص',
  'settings.databases': 'قواعد البيانات',
  'settings.updates': 'التحديث',
  network: 'الشبكة (الكل)',
  'network.interfaces': 'المنافذ',
  'network.routes': 'التوجيه',
  'network.dns': 'DNS',
  'network.sstp': 'SSTP',
};

export function splitPermissionCode(code: string): {
  resource: string;
  action: string;
} {
  const idx = code.lastIndexOf(':');
  if (idx < 0) return { resource: code, action: '' };
  return {
    resource: code.slice(0, idx),
    action: code.slice(idx + 1),
  };
}

export function permissionResourceLabel(resource: string): string {
  return PERMISSION_RESOURCE_LABELS[resource] ?? resource;
}

export function permissionActionLabel(action: string): string {
  return (
    PERMISSION_ACTION_LABELS[action as PermissionAction] ?? action
  );
}

export type PermissionMatrixRow = {
  resource: string;
  label: string;
  /** action → permission code */
  actions: Record<string, string>;
};

/** تجميع رموز صلاحيات في صفوف مورد × إجراء مع الحفاظ على الترتيب */
export function buildPermissionMatrixRows(
  codes: readonly string[],
): PermissionMatrixRow[] {
  const order: string[] = [];
  const map = new Map<string, Record<string, string>>();

  for (const code of codes) {
    const { resource, action } = splitPermissionCode(code);
    if (!resource || !action) continue;
    if (!map.has(resource)) {
      map.set(resource, {});
      order.push(resource);
    }
    map.get(resource)![action] = code;
  }

  return order.map((resource) => ({
    resource,
    label: permissionResourceLabel(resource),
    actions: map.get(resource) ?? {},
  }));
}

/** أعمدة الإجراءات الظاهرة في مجموعة رموز */
export function matrixActionsForCodes(codes: readonly string[]): string[] {
  const present = new Set(
    codes.map((code) => splitPermissionCode(code).action).filter(Boolean),
  );
  return PERMISSION_ACTION_ORDER.filter((action) => present.has(action));
}
