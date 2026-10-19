'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { LoginSectionTabs } from '@/features/page_management/components/login/LoginSectionTabs';
import { LoginSecurityCard } from '@/features/page_management/components/login/LoginSecurityCard';

export default function LoginSecurityPage() {
  return (
    <AuthGate>
      <AdminShell>
        <LoginSectionTabs />
        <div className="task-stack">
          <LoginSecurityCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
