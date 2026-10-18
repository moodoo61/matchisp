'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { CommsOverview } from '@/features/comms/components/CommsOverview';

export default function CommsPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">الاتصال</h1>
            <p className="page-sub">إدارة Asterisk والأرقام الداخلية والمكالمات</p>
          </div>
        </div>
        <CommsOverview />
      </AdminShell>
    </AuthGate>
  );
}
