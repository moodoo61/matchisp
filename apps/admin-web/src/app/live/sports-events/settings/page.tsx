'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { SportsEventsTabs } from '@/features/live/sports_events/components/SportsEventsTabs';
import { SportsEventsSettingsCard } from '@/features/live/sports_events/components/settings/SportsEventsSettingsCard';

export default function SportsEventsSettingsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <SportsEventsTabs />
        <div className="task-stack">
          <SportsEventsSettingsCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
