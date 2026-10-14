'use client';

import { use } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { WorkOrderDetailCard } from '@/features/maintenance/components/WorkOrderDetailCard';

type Props = {
  params: Promise<{ id: string }>;
};

export default function MaintenanceWorkOrderDetailPage({ params }: Props) {
  const { id } = use(params);

  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">تفاصيل أمر العمل</h1>
            <p className="page-sub">الحالة، الإجراءات، وسجل الانتقالات</p>
          </div>
        </div>
        {id ? (
          <WorkOrderDetailCard id={id} />
        ) : (
          <p className="error">معرّف غير صالح</p>
        )}
      </AdminShell>
    </AuthGate>
  );
}
