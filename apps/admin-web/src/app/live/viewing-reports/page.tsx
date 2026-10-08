'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { ViewingReportsChartsCard } from '@/features/live/viewing_reports/components/ViewingReportsChartsCard';
import { ViewingReportsDaysCard } from '@/features/live/viewing_reports/components/ViewingReportsDaysCard';
import '@/features/live/viewing_reports/styles/viewing-reports.css';

export default function LiveViewingReportsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="task-stack">
          <ViewingReportsChartsCard />
          <ViewingReportsDaysCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
