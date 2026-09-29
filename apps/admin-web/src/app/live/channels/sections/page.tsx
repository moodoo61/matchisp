'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { ChannelSectionsCard } from '@/features/live/components/channels/ChannelSectionsCard';
import { ChannelsSectionTabs } from '@/features/live/components/channels/ChannelsSectionTabs';

export default function LiveChannelSectionsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <ChannelsSectionTabs />
        <div className="task-stack">
          <ChannelSectionsCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
