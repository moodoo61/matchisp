'use client';

import { Suspense } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { DevicesCard } from '@/features/inventory/components/DevicesCard';

export default function InventoryDevicesPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">الأجهزة</h1>
            <p className="page-sub">أين الجهاز ولدى من</p>
          </div>
        </div>
        <Suspense fallback={<p className="muted">جاري التحميل…</p>}>
          <DevicesCard />
        </Suspense>
      </AdminShell>
    </AuthGate>
  );
}
