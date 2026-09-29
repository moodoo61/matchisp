'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { RoutesCard } from '@/features/settings/network/components/RoutesCard';

export default function NetworkRoutesPage() {
  return (
    <AuthGate>
      <AdminShell>
        <RoutesCard />
      </AdminShell>
    </AuthGate>
  );
}
