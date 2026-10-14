'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { MyWorkCard } from '@/features/maintenance/components/MyWorkCard';

export default function MaintenanceMyWorkPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">أوامري</h1>
            <p className="page-sub">
              قبول · بدء · طلب قطع · إنجاز — يظهر الأمر بعد تعيينه لك من
              «أوامر العمل»
            </p>
          </div>
        </div>
        <MyWorkCard />
      </AdminShell>
    </AuthGate>
  );
}
