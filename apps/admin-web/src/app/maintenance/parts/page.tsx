'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { PartsRequestsCard } from '@/features/maintenance/components/PartsRequestsCard';

export default function MaintenancePartsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">طلبات القطع</h1>
            <p className="page-sub">استلام وصرف ورفض طلبات المواد</p>
          </div>
        </div>
        <PartsRequestsCard />
      </AdminShell>
    </AuthGate>
  );
}
