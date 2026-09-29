'use client';

import { PERMISSIONS } from '@isp/shared';
import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { SpeedPlaceholderCard } from '@/features/page_management/components/speed/SpeedPlaceholderCard';
import { usePermissions } from '@/lib/usePermissions';

export default function SpeedOptionsPage() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PAGE_SPEED_READ);

  return (
    <AuthGate>
      <AdminShell>
        <div className="task-stack">
          {canRead ? (
            <SpeedPlaceholderCard />
          ) : (
            <p className="table-empty">لا تملك صلاحية عرض هذا القسم</p>
          )}
        </div>
      </AdminShell>
    </AuthGate>
  );
}
