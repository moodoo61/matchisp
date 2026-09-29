'use client';

import { usePathname } from 'next/navigation';
import { SectionTabs } from '@/shared/ui';

/** تبويبات القنوات: عامة | الأقسام */
export function ChannelsSectionTabs() {
  const pathname = usePathname();
  const isSections = pathname.startsWith('/live/channels/sections');

  return (
    <SectionTabs
      tabs={[
        {
          href: '/live/channels',
          label: 'عامة',
          active: !isSections,
        },
        {
          href: '/live/channels/sections',
          label: 'الأقسام',
          active: isSections,
        },
      ]}
    />
  );
}
