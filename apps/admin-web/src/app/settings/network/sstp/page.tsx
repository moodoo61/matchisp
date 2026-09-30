'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { NetworkSectionTabs } from '@/features/settings/network/components/NetworkSectionTabs';
import { SstpCard } from '@/features/settings/network/components/SstpCard';

export default function NetworkSstpPage() {
  return (
    <AuthGate>
      <AdminShell>
        <NetworkSectionTabs />
        <div className="task-stack">
          <SstpCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
