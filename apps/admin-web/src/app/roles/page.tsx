'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { createRole, listPermissions, listRoles } from '@/features/roles/api';
import { RoleCreateModal } from '@/features/roles/components/RoleCreateModal';
import { RolesTable } from '@/features/roles/components/RolesTable';
import type { RolePermission, RoleRow } from '@/features/roles/types';

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [roleList, permList] = await Promise.all([
        listRoles(),
        listPermissions(),
      ]);
      setRoles(roleList);
      setPermissions(permList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <h1 className="page-title">الأدوار</h1>
          <button
            className="btn"
            type="button"
            onClick={() => setShowForm(true)}
          >
            دور جديد
          </button>
        </div>

        {error ? <div className="error">{error}</div> : null}

        <RolesTable roles={roles} />

        <RoleCreateModal
          open={showForm}
          permissions={permissions}
          busy={busy}
          onClose={() => setShowForm(false)}
          onSubmit={async (payload) => {
            setBusy(true);
            setError(null);
            try {
              await createRole(payload);
              setShowForm(false);
              await load();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'خطأ');
            } finally {
              setBusy(false);
            }
          }}
        />
      </AdminShell>
    </AuthGate>
  );
}
