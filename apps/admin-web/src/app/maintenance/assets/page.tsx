'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { AssetsCard } from '@/features/maintenance/components/AssetsCard';

export default function MaintenanceAssetsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">الأصول</h1>
            <p className="page-sub">
              مشتركون / أجهزة / مواقع — مع تاريخ أوامر العمل
            </p>
          </div>
        </div>
        <AssetsCard />
      </AdminShell>
    </AuthGate>
  );
}
