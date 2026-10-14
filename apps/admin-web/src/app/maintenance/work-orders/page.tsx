'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { WorkOrdersCard } from '@/features/maintenance/components/WorkOrdersCard';

export default function MaintenanceWorkOrdersPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">أوامر العمل</h1>
            <p className="page-sub">توزيع ومتابعة أوامر العمل الميدانية</p>
          </div>
        </div>
        <WorkOrdersCard />
      </AdminShell>
    </AuthGate>
  );
}
