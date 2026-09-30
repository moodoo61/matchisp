'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { DnsCard } from '@/features/settings/network/components/DnsCard';
import { NetworkSectionTabs } from '@/features/settings/network/components/NetworkSectionTabs';

export default function NetworkDnsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <NetworkSectionTabs />
        <div className="task-stack">
          <DnsCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
