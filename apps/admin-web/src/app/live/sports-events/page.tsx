'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { TodayMatchesCard } from '@/features/live/sports_events/components/matches/TodayMatchesCard';
import { SportsEventsTabs } from '@/features/live/sports_events/components/SportsEventsTabs';

export default function SportsEventsTodayPage() {
  return (
    <AuthGate>
      <AdminShell>
        <SportsEventsTabs />
        <div className="task-stack">
          <TodayMatchesCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
