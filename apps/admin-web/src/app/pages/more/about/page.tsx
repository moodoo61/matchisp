'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { MorePageAboutCardsCard } from '@/features/page_management/components/more/MorePageAboutCardsCard';
import { MoreSectionTabs } from '@/features/page_management/components/more/MoreSectionTabs';

export default function MorePageAboutPage() {
  return (
    <AuthGate>
      <AdminShell>
        <MoreSectionTabs />
        <div className="task-stack">
          <MorePageAboutCardsCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
