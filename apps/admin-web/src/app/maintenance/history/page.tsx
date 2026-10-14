'use client';

import { Suspense } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { MaintenanceHistoryCard } from '@/features/maintenance/components/MaintenanceHistoryCard';

export default function MaintenanceHistoryPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">سجل الصيانة</h1>
            <p className="page-sub">
              مراجعة عمليات الصيانة المكتملة حسب الموقع أو الجهاز
            </p>
          </div>
        </div>
        <Suspense fallback={<p className="muted">جاري التحميل…</p>}>
          <MaintenanceHistoryCard />
        </Suspense>
      </AdminShell>
    </AuthGate>
  );
}
