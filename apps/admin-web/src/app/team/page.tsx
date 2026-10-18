'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { TeamMembersCard } from '@/features/team/components/TeamMembersCard';

export default function TeamPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">الفريق</h1>
            <p className="page-sub">إدارة أعضاء فريق العمل وأدوارهم</p>
          </div>
        </div>
        <TeamMembersCard />
      </AdminShell>
    </AuthGate>
  );
}
