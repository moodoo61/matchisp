'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { GeneralPowerCard } from '@/features/settings/general/components/GeneralPowerCard';
import { GeneralSettingsCard } from '@/features/settings/general/components/GeneralSettingsCard';

export default function SettingsGeneralPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="task-stack">
          <GeneralSettingsCard />
          <GeneralPowerCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
