'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { InterfacesCard } from '@/features/settings/network/components/InterfacesCard';

export default function NetworkInterfacesPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="task-stack">
          <InterfacesCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
