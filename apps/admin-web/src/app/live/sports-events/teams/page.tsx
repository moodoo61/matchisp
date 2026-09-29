'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { SportsEventsTabs } from '@/features/live/sports_events/components/SportsEventsTabs';
import { TeamsCard } from '@/features/live/sports_events/components/teams/TeamsCard';

export default function SportsEventsTeamsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <SportsEventsTabs />
        <div className="task-stack">
          <TeamsCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
