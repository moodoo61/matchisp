'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import {
  createRole,
  deleteRole,
  listPermissions,
  listRoles,
  updateRole,
} from '@/features/roles/api';
import { RoleFormModal } from '@/features/roles/components/RoleFormModal';
import { RolesTable } from '@/features/roles/components/RolesTable';
import type { RolePermission, RoleRow } from '@/features/roles/types';
import { usePermissions } from '@/lib/usePermissions';
import { notifyMutation, useToast } from '@/shared/ui';

export default function RolesPage() {
  const toast = useToast();
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.ROLES_MANAGE);

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [roleList, permList] = await Promise.all([
        listRoles(),
        listPermissions(),
      ]);
      setRoles(roleList);
      setPermissions(permList);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(role: RoleRow) {
    setEditing(role);
    setModalOpen(true);
  }

  async function handleDelete(role: RoleRow) {
    if (role.isSystem) return;
    if (
      !confirm(
        `هل تريد حذف الدور «${role.name}»؟ لا يمكن التراجع عن هذا الإجراء.`,
      )
    ) {
      return;
    }
    try {
      await notifyMutation(toast, () => deleteRole(role.id), {
        success: 'تم حذف الدور',
      });
      await load();
    } catch {
      /* toast */
    }
  }

  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <h1 className="page-title">الأدوار</h1>
          {canManage ? (
            <button className="btn" type="button" onClick={openCreate}>
              دور جديد
            </button>
          ) : null}
        </div>

        {error ? <div className="error">{error}</div> : null}

        <RolesTable
          roles={roles}
          canManage={canManage}
          onEdit={openEdit}
          onDelete={(role) => {
            void handleDelete(role);
          }}
        />

        <RoleFormModal
          open={modalOpen}
          role={editing}
          permissions={permissions}
          busy={busy}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={async (payload) => {
            setBusy(true);
            setError(null);
            try {
              if (editing) {
                await notifyMutation(
                  toast,
                  () =>
                    updateRole(editing.id, {
                      name: payload.name,
                      description: payload.description,
                      permissionIds: payload.permissionIds,
                    }),
                  { success: 'تم تحديث الدور' },
                );
              } else {
                await notifyMutation(toast, () => createRole(payload), {
                  success: 'تم إنشاء الدور',
                });
              }
              setModalOpen(false);
              setEditing(null);
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
