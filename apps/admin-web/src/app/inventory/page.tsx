'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { InventoryDashboardCard } from '@/features/inventory/components/InventoryDashboardCard';

export default function InventoryPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">المخازن</h1>
            <p className="page-sub">
              مخزن واحد — أرصدة، أجهزة، ولدى من صُرفت
            </p>
          </div>
        </div>
        <InventoryDashboardCard />
      </AdminShell>
    </AuthGate>
  );
}
