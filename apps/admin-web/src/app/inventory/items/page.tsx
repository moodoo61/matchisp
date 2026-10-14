'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { ItemsCard } from '@/features/inventory/components/ItemsCard';

export default function InventoryItemsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">الأصناف</h1>
            <p className="page-sub">استهلاكية أو أجهزة متسلسلة</p>
          </div>
        </div>
        <ItemsCard />
      </AdminShell>
    </AuthGate>
  );
}
