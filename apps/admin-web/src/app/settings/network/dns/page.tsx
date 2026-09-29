'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { DnsCard } from '@/features/settings/network/components/DnsCard';

export default function NetworkDnsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="task-stack">
          <DnsCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
