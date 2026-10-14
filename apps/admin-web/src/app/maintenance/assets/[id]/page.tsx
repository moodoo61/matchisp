'use client';

import { use } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { AssetDetailCard } from '@/features/maintenance/components/AssetDetailCard';

type Props = { params: Promise<{ id: string }> };

export default function MaintenanceAssetDetailPage({ params }: Props) {
  const { id } = use(params);

  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">تفاصيل الأصل</h1>
            <p className="page-sub">تاريخ الأوامر والبلاغات المرتبطة</p>
          </div>
        </div>
        {id ? (
          <AssetDetailCard id={id} />
        ) : (
          <p className="error">معرّف غير صالح</p>
        )}
      </AdminShell>
    </AuthGate>
  );
}
