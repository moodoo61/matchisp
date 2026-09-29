'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { LoginPackagesCard } from '@/features/page_management/components/login/LoginPackagesCard';
import { LoginSectionTabs } from '@/features/page_management/components/login/LoginSectionTabs';

export default function LoginPackagesPage() {
  return (
    <AuthGate>
      <AdminShell>
        <LoginSectionTabs />
        <div className="task-stack">
          <LoginPackagesCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
