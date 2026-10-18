'use client';

import { usePathname } from 'next/navigation';
import { SectionTabs } from '@/shared/ui';

/** تبويبات أقسام ص المزيد */
export function MoreSectionTabs() {
  const pathname = usePathname();
  const isItems = pathname.startsWith('/pages/more/items');
  const isAbout = pathname.startsWith('/pages/more/about');
  const isStory = pathname.startsWith('/pages/more/story');
  const isSettings = !isItems && !isAbout && !isStory;

  return (
    <SectionTabs
      tabs={[
        {
          href: '/pages/more',
          label: 'إعدادات',
          active: isSettings,
        },
        {
          href: '/pages/more/items',
          label: 'العناصر',
          active: isItems,
        },
        {
          href: '/pages/more/about',
          label: 'من نحن',
          active: isAbout,
        },
        {
          href: '/pages/more/story',
          label: 'القصة',
          active: isStory,
        },
      ]}
    />
  );
}
