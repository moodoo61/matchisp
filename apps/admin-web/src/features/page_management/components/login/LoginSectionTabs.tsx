'use client';

import { usePathname } from 'next/navigation';
import { SectionTabs } from '@/shared/ui';

/** تبويبات أقسام ص تسجيل الدخول: عامة | الباقات */
export function LoginSectionTabs() {
  const pathname = usePathname();
  const isPackages = pathname.startsWith('/pages/login/packages');

  return (
    <SectionTabs
      tabs={[
        {
          href: '/pages/login',
          label: 'عامة',
          active: !isPackages,
        },
        {
          href: '/pages/login/packages',
          label: 'الباقات',
          active: isPackages,
        },
      ]}
    />
  );
}
