'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PERMISSIONS } from '@isp/shared';
import { clearTokens, getTokens, api } from '@/lib/api';
import { clearAuthUser } from '@/lib/authSession';
import { usePermissions } from '@/lib/usePermissions';
import { SidebarNav, ToastProvider, type NavItem } from '@/shared/ui';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { can, canAny } = usePermissions();

  const navItems = useMemo(() => {
    const pageChildren: NavItem['children'] = [];
    if (
      canAny([
        PERMISSIONS.PAGE_MANAGEMENT_READ,
        PERMISSIONS.PAGE_LOGIN_IMAGES_READ,
        PERMISSIONS.PAGE_LOGIN_TICKER_READ,
        PERMISSIONS.PAGE_LOGIN_SERVICES_READ,
        PERMISSIONS.PAGE_LOGIN_CONTACTS_READ,
        PERMISSIONS.PAGE_LOGIN_PACKAGES_READ,
      ])
    ) {
      pageChildren.push({ href: '/pages/login', label: 'ص تسجيل الدخول' });
    }
    if (
      canAny([
        PERMISSIONS.PAGE_MANAGEMENT_READ,
        PERMISSIONS.PAGE_STATUS_SERVICES_READ,
      ])
    ) {
      pageChildren.push({ href: '/pages/status', label: 'ص الحالة' });
    }
    if (
      canAny([PERMISSIONS.PAGE_MANAGEMENT_READ, PERMISSIONS.PAGE_SPEED_READ])
    ) {
      pageChildren.push({ href: '/pages/speed', label: 'خيارات السرعة' });
    }

    const items: NavItem[] = [];
    if (can(PERMISSIONS.DASHBOARD_READ)) {
      items.push({ href: '/', label: 'نظرة عامة' });
    }
    if (pageChildren.length) {
      items.push({
        href: '/pages',
        label: 'إدارة الصفحة',
        children: pageChildren,
      });
    }
    if (
      canAny([
        PERMISSIONS.LIVE_READ,
        PERMISSIONS.LIVE_CHANNELS_READ,
        PERMISSIONS.LIVE_ENCODING_READ,
        PERMISSIONS.LIVE_VIEWING_PAGE_READ,
        PERMISSIONS.LIVE_SPORTS_EVENTS_READ,
        PERMISSIONS.LIVE_MANAGE,
        PERMISSIONS.LIVE_CHANNELS_MANAGE,
        PERMISSIONS.LIVE_CHANNELS_CREATE,
        PERMISSIONS.LIVE_CHANNELS_UPDATE,
        PERMISSIONS.LIVE_CHANNELS_DELETE,
        PERMISSIONS.LIVE_CHANNELS_TOGGLE,
        PERMISSIONS.LIVE_CHANNELS_CONTROL,
        PERMISSIONS.LIVE_ENCODING_MANAGE,
        PERMISSIONS.LIVE_ENCODING_UPDATE,
        PERMISSIONS.LIVE_VIEWING_PAGE_MANAGE,
        PERMISSIONS.LIVE_VIEWING_PAGE_UPDATE,
        PERMISSIONS.LIVE_VIEWING_PAGE_TOGGLE,
        PERMISSIONS.LIVE_SPORTS_EVENTS_MANAGE,
        PERMISSIONS.LIVE_SPORTS_EVENTS_CREATE,
        PERMISSIONS.LIVE_SPORTS_EVENTS_UPDATE,
        PERMISSIONS.LIVE_SPORTS_EVENTS_DELETE,
      ])
    ) {
      const liveChildren: NonNullable<NavItem['children']> = [];
      if (
        canAny([
          PERMISSIONS.LIVE_READ,
          PERMISSIONS.LIVE_CHANNELS_READ,
          PERMISSIONS.LIVE_MANAGE,
          PERMISSIONS.LIVE_CHANNELS_MANAGE,
          PERMISSIONS.LIVE_CHANNELS_CREATE,
          PERMISSIONS.LIVE_CHANNELS_UPDATE,
          PERMISSIONS.LIVE_CHANNELS_DELETE,
          PERMISSIONS.LIVE_CHANNELS_TOGGLE,
          PERMISSIONS.LIVE_CHANNELS_CONTROL,
        ])
      ) {
        liveChildren.push({ href: '/live/channels', label: 'القنوات' });
      }
      if (
        canAny([
          PERMISSIONS.LIVE_READ,
          PERMISSIONS.LIVE_SPORTS_EVENTS_READ,
          PERMISSIONS.LIVE_MANAGE,
          PERMISSIONS.LIVE_SPORTS_EVENTS_MANAGE,
          PERMISSIONS.LIVE_SPORTS_EVENTS_CREATE,
          PERMISSIONS.LIVE_SPORTS_EVENTS_UPDATE,
          PERMISSIONS.LIVE_SPORTS_EVENTS_DELETE,
        ])
      ) {
        liveChildren.push({
          href: '/live/sports-events',
          label: 'الأحداث الرياضية',
        });
      }
      if (
        canAny([
          PERMISSIONS.LIVE_READ,
          PERMISSIONS.LIVE_ENCODING_READ,
          PERMISSIONS.LIVE_MANAGE,
          PERMISSIONS.LIVE_ENCODING_MANAGE,
          PERMISSIONS.LIVE_ENCODING_UPDATE,
        ])
      ) {
        liveChildren.push({
          href: '/live/encoding',
          label: 'الجودة والترميز',
        });
      }
      if (
        canAny([
          PERMISSIONS.LIVE_READ,
          PERMISSIONS.LIVE_VIEWING_PAGE_READ,
          PERMISSIONS.LIVE_MANAGE,
          PERMISSIONS.LIVE_VIEWING_PAGE_MANAGE,
          PERMISSIONS.LIVE_VIEWING_PAGE_UPDATE,
          PERMISSIONS.LIVE_VIEWING_PAGE_TOGGLE,
        ])
      ) {
        liveChildren.push({
          href: '/live/viewing-page',
          label: 'صفحة المشاهدة',
        });
      }
      if (liveChildren.length) {
        items.push({
          href: '/live',
          label: 'خـ.البث المباشر',
          children: liveChildren,
        });
      }
    }
    if (can(PERMISSIONS.TEAM_READ)) {
      items.push({ href: '/team', label: 'الفريق' });
    }
    if (
      canAny([
        PERMISSIONS.PARTNERS_READ,
        PERMISSIONS.PARTNERS_CREATE,
        PERMISSIONS.PARTNERS_UPDATE,
        PERMISSIONS.PARTNERS_DELETE,
      ])
    ) {
      items.push({ href: '/partners', label: 'الوكلاء' });
    }
    if (
      canAny([
        PERMISSIONS.SERVICE_MONITOR_READ,
        PERMISSIONS.SERVICE_MONITOR_MANAGE,
        PERMISSIONS.SERVICE_MONITOR_UPDATE,
      ])
    ) {
      items.push({ href: '/service-monitor', label: 'مراقب خدمات' });
    }
    if (
      canAny([
        PERMISSIONS.SETTINGS_READ,
        PERMISSIONS.SETTINGS_MANAGE,
        PERMISSIONS.SETTINGS_DISKS_READ,
        PERMISSIONS.SETTINGS_DISKS_MANAGE,
        PERMISSIONS.SETTINGS_DISKS_MOUNT,
        PERMISSIONS.SETTINGS_DISKS_UNMOUNT,
        PERMISSIONS.SETTINGS_DATABASES_READ,
        PERMISSIONS.SETTINGS_DATABASES_MANAGE,
        PERMISSIONS.SETTINGS_DATABASES_BACKUP,
        PERMISSIONS.SETTINGS_DATABASES_RESTORE,
        PERMISSIONS.NETWORK_READ,
        PERMISSIONS.NETWORK_MANAGE,
        PERMISSIONS.NETWORK_INTERFACES_READ,
        PERMISSIONS.NETWORK_INTERFACES_MANAGE,
        PERMISSIONS.NETWORK_ROUTES_READ,
        PERMISSIONS.NETWORK_ROUTES_MANAGE,
        PERMISSIONS.NETWORK_DNS_READ,
      ])
    ) {
      const settingsChildren: NonNullable<NavItem['children']> = [];
      if (
        canAny([
          PERMISSIONS.SETTINGS_READ,
          PERMISSIONS.SETTINGS_MANAGE,
          PERMISSIONS.SETTINGS_DISKS_READ,
          PERMISSIONS.SETTINGS_DISKS_MANAGE,
          PERMISSIONS.SETTINGS_DISKS_MOUNT,
          PERMISSIONS.SETTINGS_DISKS_UNMOUNT,
        ])
      ) {
        settingsChildren.push({
          href: '/settings/disks',
          label: 'إدارة الأقراص',
        });
      }
      if (
        canAny([
          PERMISSIONS.SETTINGS_READ,
          PERMISSIONS.SETTINGS_MANAGE,
          PERMISSIONS.SETTINGS_DATABASES_READ,
          PERMISSIONS.SETTINGS_DATABASES_MANAGE,
          PERMISSIONS.SETTINGS_DATABASES_BACKUP,
          PERMISSIONS.SETTINGS_DATABASES_RESTORE,
        ])
      ) {
        settingsChildren.push({
          href: '/settings/databases',
          label: 'قواعد البيانات',
        });
      }
      if (
        canAny([
          PERMISSIONS.NETWORK_READ,
          PERMISSIONS.NETWORK_MANAGE,
          PERMISSIONS.NETWORK_INTERFACES_READ,
          PERMISSIONS.NETWORK_INTERFACES_MANAGE,
        ])
      ) {
        settingsChildren.push({
          href: '/settings/network/interfaces',
          label: 'المنافذ والعنونة',
        });
      }
      if (
        canAny([
          PERMISSIONS.NETWORK_READ,
          PERMISSIONS.NETWORK_MANAGE,
          PERMISSIONS.NETWORK_ROUTES_READ,
          PERMISSIONS.NETWORK_ROUTES_MANAGE,
        ])
      ) {
        settingsChildren.push({
          href: '/settings/network/routes',
          label: 'التوجيه',
        });
      }
      if (
        canAny([
          PERMISSIONS.NETWORK_READ,
          PERMISSIONS.NETWORK_MANAGE,
          PERMISSIONS.NETWORK_DNS_READ,
        ])
      ) {
        settingsChildren.push({
          href: '/settings/network/dns',
          label: 'DNS',
        });
      }
      if (settingsChildren.length) {
        items.push({
          href: '/settings',
          label: 'الإعدادات',
          children: settingsChildren,
        });
      }
    }
    if (can(PERMISSIONS.ROLES_READ)) {
      items.push({ href: '/roles', label: 'الأدوار والصلاحيات' });
    }
    if (can(PERMISSIONS.AUDIT_READ)) {
      items.push({ href: '/audit', label: 'سجلات التدقيق' });
    }
    return items;
  }, [can, canAny]);

  async function logout() {
    const tokens = getTokens();
    try {
      if (tokens) {
        await api('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
      }
    } catch {
      // ignore
    }
    clearTokens();
    clearAuthUser();
    router.replace('/login');
  }

  return (
    <ToastProvider>
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            ISP Admin
            <span>نظام إدارة مكتب خدمات إنترنت</span>
          </div>
          <SidebarNav items={navItems} />
          <button className="btn secondary" type="button" onClick={logout}>
            تسجيل الخروج
          </button>
        </aside>
        <main className="content content-compact">{children}</main>
      </div>
    </ToastProvider>
  );
}
