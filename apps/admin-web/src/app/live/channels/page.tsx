'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { ChannelsCard } from '@/features/live/components/channels/ChannelsCard';
import { ChannelsOverviewCards } from '@/features/live/components/channels/ChannelsOverviewCards';
import { ChannelsSectionTabs } from '@/features/live/components/channels/ChannelsSectionTabs';

export default function LiveChannelsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <ChannelsSectionTabs />
        <div className="task-stack">
          <ChannelsOverviewCards />
          <ChannelsCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
