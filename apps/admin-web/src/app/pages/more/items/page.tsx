'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { MorePageItemsCard } from '@/features/page_management/components/more/MorePageItemsCard';
import { MoreSectionTabs } from '@/features/page_management/components/more/MoreSectionTabs';

export default function MorePageItemsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <MoreSectionTabs />
        <div className="task-stack">
          <MorePageItemsCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
