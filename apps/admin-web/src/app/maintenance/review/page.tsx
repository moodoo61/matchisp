'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { ReviewQueueCard } from '@/features/maintenance/components/ReviewQueueCard';

export default function MaintenanceReviewPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">مراجعة الإنجاز</h1>
            <p className="page-sub">
              طابور الأوامر المنجزة فنياً — اعتماد وإغلاق أو إعادة تنفيذ
            </p>
          </div>
        </div>
        <ReviewQueueCard />
      </AdminShell>
    </AuthGate>
  );
}
