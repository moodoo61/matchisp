'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { PERMISSIONS } from '@isp/shared';
import { usePermissions } from '@/lib/usePermissions';
import { SectionTabs, type SectionTab } from '@/shared/ui';

/** تبويبات أقسام الشبكة داخل الصفحة (ليست في الشريط الجانبي) */
export function NetworkSectionTabs() {
  const pathname = usePathname();
  const { canAny } = usePermissions();

  const tabs = useMemo(() => {
    const list: SectionTab[] = [];

    if (
      canAny([
        PERMISSIONS.NETWORK_READ,
        PERMISSIONS.NETWORK_MANAGE,
        PERMISSIONS.NETWORK_INTERFACES_READ,
        PERMISSIONS.NETWORK_INTERFACES_MANAGE,
      ])
    ) {
      list.push({
        href: '/settings/network',
        label: 'المنافذ والعنونة',
        active:
          pathname === '/settings/network' ||
          pathname.startsWith('/settings/network/interfaces'),
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
      list.push({
        href: '/settings/network/routes',
        label: 'التوجيه',
        active: pathname.startsWith('/settings/network/routes'),
      });
    }

    if (
      canAny([
        PERMISSIONS.NETWORK_READ,
        PERMISSIONS.NETWORK_MANAGE,
        PERMISSIONS.NETWORK_DNS_READ,
      ])
    ) {
      list.push({
        href: '/settings/network/dns',
        label: 'DNS',
        active: pathname.startsWith('/settings/network/dns'),
      });
    }

    return list;
  }, [canAny, pathname]);

  if (tabs.length <= 1) return null;

  return <SectionTabs tabs={tabs} />;
}
