'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { DisksCard } from '@/features/settings/disks/components/DisksCard';

export default function SettingsDisksPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="task-stack">
          <DisksCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
