'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { ServiceMonitorOverview } from '@/features/service_monitor/components/ServiceMonitorOverview';

export default function ServiceMonitorPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">مراقب خدمات</h1>
            <p className="page-sub">متابعة حالة الخدمات المرتبطة بالمشروع</p>
          </div>
        </div>
        <div className="task-stack">
          <ServiceMonitorOverview />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
