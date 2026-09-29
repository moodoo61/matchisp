'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { LoginContactsCard } from '@/features/page_management/components/login/LoginContactsCard';
import { LoginImageAdsCard } from '@/features/page_management/components/login/LoginImageAdsCard';
import { LoginSectionTabs } from '@/features/page_management/components/login/LoginSectionTabs';
import { LoginServicesCard } from '@/features/page_management/components/login/LoginServicesCard';
import { LoginTextAdsCard } from '@/features/page_management/components/login/LoginTextAdsCard';

export default function LoginGeneralPage() {
  return (
    <AuthGate>
      <AdminShell>
        <LoginSectionTabs />
        <div className="task-stack">
          <LoginImageAdsCard />
          <LoginTextAdsCard />
          <LoginServicesCard />
          <LoginContactsCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
