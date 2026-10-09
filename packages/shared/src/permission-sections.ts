import { ALL_PERMISSIONS } from './permissions';

/** عقدة في شجرة الصلاحيات (قسم / فرعي / صلاحيات) */
export type PermissionTreeNode = {
  key: string;
  label: string;
  /** صلاحيات مباشرة على هذا المستوى */
  codes?: readonly string[];
  children?: readonly PermissionTreeNode[];
};

/**
 * هيكل النظام للصلاحيات — يطابق الشريط الجانبي والأقسام الفرعية.
 * network تحت الإعدادات كما في الواجهة.
 */
export const PERMISSION_TREE: readonly PermissionTreeNode[] = [
  {
    key: 'dashboard',
    label: 'نظرة عامة',
    codes: ['dashboard:read'],
  },
  {
    key: 'page_management',
    label: 'إدارة الصفحة',
    codes: ['page_management:read', 'page_management:manage'],
    children: [
      {
        key: 'page_management.login',
        label: 'ص تسجيل الدخول',
        codes: [
          'page_management.login.images:read',
          'page_management.login.images:create',
          'page_management.login.images:update',
          'page_management.login.images:delete',
          'page_management.login.images:toggle',
          'page_management.login.images:manage',
          'page_management.login.ticker:read',
          'page_management.login.ticker:create',
          'page_management.login.ticker:update',
          'page_management.login.ticker:delete',
          'page_management.login.ticker:toggle',
          'page_management.login.ticker:manage',
          'page_management.login.services:read',
          'page_management.login.services:create',
          'page_management.login.services:update',
          'page_management.login.services:delete',
          'page_management.login.services:toggle',
          'page_management.login.services:manage',
          'page_management.login.contacts:read',
          'page_management.login.contacts:create',
          'page_management.login.contacts:update',
          'page_management.login.contacts:delete',
          'page_management.login.contacts:toggle',
          'page_management.login.contacts:manage',
          'page_management.login.packages:read',
          'page_management.login.packages:create',
          'page_management.login.packages:update',
          'page_management.login.packages:delete',
          'page_management.login.packages:toggle',
          'page_management.login.packages:manage',
        ],
      },
      {
        key: 'page_management.status',
        label: 'ص الحالة',
        codes: [
          'page_management.status.services:read',
          'page_management.status.services:create',
          'page_management.status.services:update',
          'page_management.status.services:delete',
          'page_management.status.services:toggle',
          'page_management.status.services:manage',
        ],
      },
      {
        key: 'page_management.speed',
        label: 'خيارات السرعة',
        codes: [
          'page_management.speed:read',
          'page_management.speed:update',
          'page_management.speed:manage',
        ],
      },
    ],
  },
  {
    key: 'live',
    label: 'البث المباشر',
    codes: ['live:read', 'live:manage'],
    children: [
      {
        key: 'live.channels',
        label: 'القنوات',
        codes: [
          'live.channels:read',
          'live.channels:manage',
          'live.channels:create',
          'live.channels:update',
          'live.channels:delete',
          'live.channels:toggle',
          'live.channels:control',
        ],
      },
      {
        key: 'live.sports_events',
        label: 'الأحداث الرياضية',
        codes: [
          'live.sports_events:read',
          'live.sports_events:manage',
          'live.sports_events:create',
          'live.sports_events:update',
          'live.sports_events:delete',
        ],
      },
      {
        key: 'live.viewing_page',
        label: 'صفحة المشاهدة',
        codes: [
          'live.viewing_page:read',
          'live.viewing_page:manage',
          'live.viewing_page:update',
          'live.viewing_page:toggle',
        ],
      },
      {
        key: 'live.viewing_reports',
        label: 'تقارير المشاهدة',
        codes: [
          'live.viewing_reports:read',
          'live.viewing_reports:manage',
          'live.viewing_reports:update',
          'live.viewing_reports:delete',
        ],
      },
      {
        key: 'live.encoding',
        label: 'الجودة والترميز',
        codes: [
          'live.encoding:read',
          'live.encoding:manage',
          'live.encoding:update',
        ],
      },
    ],
  },
  {
    key: 'team',
    label: 'الفريق',
    codes: [
      'team:read',
      'team:create',
      'team:update',
      'team:delete',
    ],
  },
  {
    key: 'partners',
    label: 'الوكلاء',
    codes: [
      'partners:read',
      'partners:create',
      'partners:update',
      'partners:delete',
    ],
  },
  {
    key: 'service_monitor',
    label: 'مراقب خدمات',
    codes: [
      'service_monitor:read',
      'service_monitor:manage',
      'service_monitor:update',
    ],
  },
  {
    key: 'settings',
    label: 'الإعدادات',
    codes: ['settings:read', 'settings:manage'],
    children: [
      {
        key: 'settings.general',
        label: 'عامة',
        codes: [
          'settings.general:read',
          'settings.general:manage',
          'settings.general:reboot',
          'settings.general:shutdown',
        ],
      },
      {
        key: 'settings.disks',
        label: 'إدارة الأقراص',
        codes: [
          'settings.disks:read',
          'settings.disks:manage',
          'settings.disks:mount',
          'settings.disks:unmount',
        ],
      },
      {
        key: 'settings.databases',
        label: 'قواعد البيانات',
        codes: [
          'settings.databases:read',
          'settings.databases:manage',
          'settings.databases:backup',
          'settings.databases:restore',
        ],
      },
      {
        key: 'settings.updates',
        label: 'التحديث',
        codes: [
          'settings.updates:read',
          'settings.updates:manage',
          'settings.updates:apply',
        ],
      },
      {
        key: 'network',
        label: 'الشبكة',
        codes: ['network:read', 'network:manage'],
        children: [
          {
            key: 'network.interfaces',
            label: 'المنافذ',
            codes: [
              'network.interfaces:read',
              'network.interfaces:manage',
            ],
          },
          {
            key: 'network.routes',
            label: 'التوجيه',
            codes: [
              'network.routes:read',
              'network.routes:manage',
            ],
          },
          {
            key: 'network.dns',
            label: 'DNS',
            codes: ['network.dns:read', 'network.dns:manage'],
          },
          {
            key: 'network.sstp',
            label: 'SSTP',
            codes: [
              'network.sstp:read',
              'network.sstp:manage',
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'roles',
    label: 'الأدوار',
    codes: ['roles:read', 'roles:manage'],
  },
  {
    key: 'audit',
    label: 'سجلات التدقيق',
    codes: ['audit:read'],
  },
];

export type PermissionTreeViewNode = {
  key: string;
  label: string;
  /** رموز مباشرة معروضة تحت هذه العقدة */
  codes: string[];
  /** كل الرموز تحت العقدة (مباشرة + أبناء) لتحديد دفعة واحدة */
  allCodes: string[];
  children: PermissionTreeViewNode[];
};

function collectAllCodes(node: PermissionTreeNode): string[] {
  const own = [...(node.codes ?? [])];
  const nested = (node.children ?? []).flatMap((child) =>
    collectAllCodes(child),
  );
  return [...own, ...nested];
}

function filterNode(
  node: PermissionTreeNode,
  available: Set<string>,
): PermissionTreeViewNode | null {
  const ownCodes = (node.codes ?? []).filter((code) => available.has(code));
  const children = (node.children ?? [])
    .map((child) => filterNode(child, available))
    .filter((child): child is PermissionTreeViewNode => Boolean(child));

  if (!ownCodes.length && !children.length) return null;

  const allCodes = [
    ...ownCodes,
    ...children.flatMap((child) => child.allCodes),
  ];

  return {
    key: node.key,
    label: node.label,
    codes: ownCodes,
    allCodes,
    children,
  };
}

/** يبني شجرة العرض من الصلاحيات المتوفرة فقط */
export function buildPermissionTree(
  codes: readonly string[] = ALL_PERMISSIONS,
): PermissionTreeViewNode[] {
  const available = new Set(codes);
  const used = new Set<string>();
  const tree: PermissionTreeViewNode[] = [];

  for (const node of PERMISSION_TREE) {
    const view = filterNode(node, available);
    if (!view) continue;
    tree.push(view);
    for (const code of view.allCodes) used.add(code);
  }

  const leftover = codes.filter((code) => !used.has(code));
  if (leftover.length) {
    tree.push({
      key: 'other',
      label: 'أخرى',
      codes: leftover,
      allCodes: leftover,
      children: [],
    });
  }

  return tree;
}

/** توافق مؤقت مع الاستيرادات القديمة */
export function permissionSectionKey(code: string): string {
  const resource = (code.split(':')[0] ?? code).trim();
  return resource.split('.')[0] || resource || 'other';
}

export const PERMISSION_SECTION_ORDER = [
  'dashboard',
  'page_management',
  'live',
  'team',
  'partners',
  'service_monitor',
  'settings',
  'network',
  'roles',
  'audit',
] as const;

export type PermissionSectionKey =
  | (typeof PERMISSION_SECTION_ORDER)[number]
  | 'other';

export const PERMISSION_SECTION_LABELS: Record<PermissionSectionKey, string> = {
  dashboard: 'نظرة عامة',
  page_management: 'إدارة الصفحة',
  live: 'البث المباشر',
  team: 'الفريق',
  partners: 'الوكلاء',
  service_monitor: 'مراقب الخدمات',
  settings: 'الإعدادات',
  network: 'الشبكة',
  roles: 'الأدوار',
  audit: 'سجلات التدقيق',
  other: 'أخرى',
};

export function groupPermissionCodesBySection(
  codes: readonly string[] = ALL_PERMISSIONS,
): Array<{ key: PermissionSectionKey; label: string; codes: string[] }> {
  return buildPermissionTree(codes).map((node) => ({
    key: node.key as PermissionSectionKey,
    label: node.label,
    codes: node.allCodes,
  }));
}
