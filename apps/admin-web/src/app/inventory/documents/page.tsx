'use client';

import { Suspense } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { DocumentsCard } from '@/features/inventory/components/DocumentsCard';

export default function InventoryDocumentsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">التوريد والصرف</h1>
            <p className="page-sub">
              مسودة ثم اعتماد — الرصيد يتحدث عند الاعتماد فقط
            </p>
          </div>
        </div>
        <Suspense fallback={<p className="muted">جاري التحميل…</p>}>
          <DocumentsCard />
        </Suspense>
      </AdminShell>
    </AuthGate>
  );
}
