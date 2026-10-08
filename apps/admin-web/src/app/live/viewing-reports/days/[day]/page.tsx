'use client';

import { use } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { ViewingReportsDaySessionsCard } from '@/features/live/viewing_reports/components/ViewingReportsDaySessionsCard';
import '@/features/live/viewing_reports/styles/viewing-reports.css';

type Props = {
  params: Promise<{ day: string }>;
};

export default function LiveViewingReportsDayPage({ params }: Props) {
  const { day } = use(params);
  const safeDay = /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : '';

  return (
    <AuthGate>
      <AdminShell>
        <div className="task-stack">
          {safeDay ? (
            <ViewingReportsDaySessionsCard day={safeDay} />
          ) : (
            <p className="error">تاريخ غير صالح</p>
          )}
        </div>
      </AdminShell>
    </AuthGate>
  );
}
