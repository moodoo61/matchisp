'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { NetworkSectionTabs } from '@/features/settings/network/components/NetworkSectionTabs';
import { RoutesCard } from '@/features/settings/network/components/RoutesCard';

export default function NetworkRoutesPage() {
  return (
    <AuthGate>
      <AdminShell>
        <NetworkSectionTabs />
        <div className="task-stack">
          <RoutesCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
