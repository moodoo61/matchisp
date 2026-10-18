'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { MorePageSettingsCard } from '@/features/page_management/components/more/MorePageSettingsCard';
import { MoreSectionTabs } from '@/features/page_management/components/more/MoreSectionTabs';

export default function MorePageSettingsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <MoreSectionTabs />
        <div className="task-stack">
          <MorePageSettingsCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
