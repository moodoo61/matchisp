'use client';

import { usePathname } from 'next/navigation';
import { SectionTabs } from '@/shared/ui';

/** تبويبات الوكلاء: القائمة | ضبط */
export function PartnersTabs() {
  const pathname = usePathname();
  const isSettings = pathname.startsWith('/partners/settings');

  return (
    <SectionTabs
      tabs={[
        {
          href: '/partners',
          label: 'الوكلاء',
          active: !isSettings,
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
