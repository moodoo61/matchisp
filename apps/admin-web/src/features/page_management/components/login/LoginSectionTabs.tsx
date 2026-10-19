'use client';

import { usePathname } from 'next/navigation';
import { SectionTabs } from '@/shared/ui';

/** تبويبات أقسام ص تسجيل الدخول: عامة | الباقات | أمان | مصادقة خارجية */
export function LoginSectionTabs() {
  const pathname = usePathname();
  const isPackages = pathname.startsWith('/pages/login/packages');
  const isSecurity = pathname.startsWith('/pages/login/security');
  const isExternalAuth = pathname.startsWith('/pages/login/external-auth');

  return (
    <SectionTabs
      tabs={[
        {
          href: '/pages/login',
          label: 'عامة',
          active: !isPackages && !isSecurity && !isExternalAuth,
        },
        {
          href: '/pages/login/packages',
          label: 'الباقات',
          active: isPackages,
        },
        {
          href: '/pages/login/security',
          label: 'أمان',
          active: isSecurity,
        },
        {
          href: '/pages/login/external-auth',
          label: 'مصادقة خارجية',
          active: isExternalAuth,
        },
      ]}
    />
  );
}
