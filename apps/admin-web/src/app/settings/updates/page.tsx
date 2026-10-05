'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { UpdatesCard } from '@/features/settings/updates/components/UpdatesCard';

export default function SettingsUpdatesPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="task-stack">
          <UpdatesCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
