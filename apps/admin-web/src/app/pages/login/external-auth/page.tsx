'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { LoginExternalAuthCard } from '@/features/page_management/components/login/LoginExternalAuthCard';
import { LoginSectionTabs } from '@/features/page_management/components/login/LoginSectionTabs';

export default function LoginExternalAuthPage() {
  return (
    <AuthGate>
      <AdminShell>
        <LoginSectionTabs />
        <div className="task-stack">
          <LoginExternalAuthCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
