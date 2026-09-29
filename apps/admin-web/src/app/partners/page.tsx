'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { AgentsCard } from '@/features/partners/components/AgentsCard';
import { PartnersTabs } from '@/features/partners/components/PartnersTabs';

export default function PartnersPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">الوكلاء</h1>
            <p className="page-sub">إدارة بيانات الوكلاء والمحال</p>
          </div>
        </div>
        <PartnersTabs />
        <div className="task-stack">
          <AgentsCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
