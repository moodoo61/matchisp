'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { MorePageStoryCard } from '@/features/page_management/components/more/MorePageStoryCard';
import { MoreSectionTabs } from '@/features/page_management/components/more/MoreSectionTabs';

export default function MorePageStoryPage() {
  return (
    <AuthGate>
      <AdminShell>
        <MoreSectionTabs />
        <div className="task-stack">
          <MorePageStoryCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
