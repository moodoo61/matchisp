'use client';

import { usePathname } from 'next/navigation';
import { SectionTabs } from '@/shared/ui';

/** تبويبات الأحداث الرياضية: المباريات | الفرق | ضبط */
export function SportsEventsTabs() {
  const pathname = usePathname();
  const isTeams = pathname.startsWith('/live/sports-events/teams');
  const isSettings = pathname.startsWith('/live/sports-events/settings');

  return (
    <SectionTabs
      tabs={[
        {
          href: '/live/sports-events',
          label: 'المباريات',
          active: !isTeams && !isSettings,
        },
        {
          href: '/live/sports-events/teams',
          label: 'الفرق',
          active: isTeams,
        },
        {
          href: '/live/sports-events/settings',
          label: 'ضبط',
          active: isSettings,
        },
      ]}
    />
  );
}
