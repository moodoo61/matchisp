'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { MovementsCard } from '@/features/inventory/components/MovementsCard';

export default function InventoryMovementsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">سجل الحركات</h1>
            <p className="page-sub">دفتر توثيق غير قابل للتعديل</p>
          </div>
        </div>
        <MovementsCard />
      </AdminShell>
    </AuthGate>
  );
}
