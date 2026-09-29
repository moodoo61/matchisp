'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { StatusServicesCard } from '@/features/page_management/components/status/StatusServicesCard';

export default function StatusPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="task-stack">
          <StatusServicesCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
