"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSION_RESOURCE_LABELS = exports.PERMISSION_ACTION_LABELS = exports.PERMISSION_ACTION_ORDER = void 0;
exports.splitPermissionCode = splitPermissionCode;
exports.permissionResourceLabel = permissionResourceLabel;
exports.permissionActionLabel = permissionActionLabel;
exports.buildPermissionMatrixRows = buildPermissionMatrixRows;
exports.matrixActionsForCodes = matrixActionsForCodes;
exports.PERMISSION_ACTION_ORDER = [
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
];
exports.PERMISSION_ACTION_LABELS = {
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
exports.PERMISSION_RESOURCE_LABELS = {
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
    'live.encoding': 'الجودة والترميز',
    'live.viewing_page': 'صفحة المشاهدة',
    'live.sports_events': 'الأحداث الرياضية',
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
function splitPermissionCode(code) {
    const idx = code.lastIndexOf(':');
    if (idx < 0)
        return { resource: code, action: '' };
    return {
        resource: code.slice(0, idx),
        action: code.slice(idx + 1),
    };
}
function permissionResourceLabel(resource) {
    return exports.PERMISSION_RESOURCE_LABELS[resource] ?? resource;
}
function permissionActionLabel(action) {
    return (exports.PERMISSION_ACTION_LABELS[action] ?? action);
}
function buildPermissionMatrixRows(codes) {
    const order = [];
    const map = new Map();
    for (const code of codes) {
        const { resource, action } = splitPermissionCode(code);
        if (!resource || !action)
            continue;
        if (!map.has(resource)) {
            map.set(resource, {});
            order.push(resource);
        }
        map.get(resource)[action] = code;
    }
    return order.map((resource) => ({
        resource,
        label: permissionResourceLabel(resource),
        actions: map.get(resource) ?? {},
    }));
}
function matrixActionsForCodes(codes) {
    const present = new Set(codes.map((code) => splitPermissionCode(code).action).filter(Boolean));
    return exports.PERMISSION_ACTION_ORDER.filter((action) => present.has(action));
}
//# sourceMappingURL=permission-matrix.js.map