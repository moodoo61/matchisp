'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { PartnersTabs } from '@/features/partners/components/PartnersTabs';
import { AgentsMapsSettingsCard } from '@/features/partners/components/settings/AgentsMapsSettingsCard';
import { AgentsPublicApiSettingsCard } from '@/features/partners/components/settings/AgentsPublicApiSettingsCard';

export default function PartnersSettingsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">الوكلاء</h1>
            <p className="page-sub">ضبط نقطة النهاية العامة والخرائط</p>
          </div>
        </div>
        <PartnersTabs />
        <div className="task-stack">
          <AgentsPublicApiSettingsCard />
          <AgentsMapsSettingsCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
