'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { InterfacesCard } from '@/features/settings/network/components/InterfacesCard';
import { NetworkSectionTabs } from '@/features/settings/network/components/NetworkSectionTabs';

export default function NetworkPage() {
  return (
    <AuthGate>
      <AdminShell>
        <NetworkSectionTabs />
        <div className="task-stack">
          <InterfacesCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
