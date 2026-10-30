'use client';

import { usePathname } from 'next/navigation';
import { SectionTabs } from '@/shared/ui';

/** تبويبات الوكلاء: القائمة | المناطق | ضبط */
export function PartnersTabs() {
  const pathname = usePathname();
  const isSettings = pathname.startsWith('/partners/settings');
  const isRegions = pathname.startsWith('/partners/regions');

  return (
    <SectionTabs
      tabs={[
        {
          href: '/partners',
          label: 'الوكلاء',
          active: !isSettings && !isRegions,
        },
        {
          href: '/partners/regions',
          label: 'المناطق',
          active: isRegions,
        },
        {
          href: '/partners/settings',
          label: 'ضبط',
          active: isSettings,
        },
      ]}
    />
  );
}
