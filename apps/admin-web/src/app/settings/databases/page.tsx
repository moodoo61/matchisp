'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { DatabasesCard } from '@/features/settings/databases/components/DatabasesCard';

export default function SettingsDatabasesPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="task-stack">
          <DatabasesCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
