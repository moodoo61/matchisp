'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { PartnersTabs } from '@/features/partners/components/PartnersTabs';
import { RegionsCard } from '@/features/partners/components/RegionsCard';

export default function PartnersRegionsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">الوكلاء</h1>
            <p className="page-sub">إدارة المناطق</p>
          </div>
        </div>
        <PartnersTabs />
        <div className="task-stack">
          <RegionsCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
