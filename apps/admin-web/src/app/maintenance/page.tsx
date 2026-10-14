'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { MaintenanceMetricsCard } from '@/features/maintenance/components/MaintenanceMetricsCard';
import { ServiceRequestsCard } from '@/features/maintenance/components/ServiceRequestsCard';

export default function MaintenanceRequestsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">الصيانة — البلاغات</h1>
            <p className="page-sub">
              طلب → فرز/موافقة → تحويل إلى أمر عمل
            </p>
          </div>
        </div>
        <div className="task-stack">
          <MaintenanceMetricsCard />
          <ServiceRequestsCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
