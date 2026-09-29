'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { ViewingChannelsCard } from '@/features/live/client_live/components/admin/ViewingChannelsCard';
import { ViewingPageSettingsCard } from '@/features/live/client_live/components/admin/ViewingPageSettingsCard';

export default function LiveViewingPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="task-stack">
          <ViewingPageSettingsCard />
          <ViewingChannelsCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
