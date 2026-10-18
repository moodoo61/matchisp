'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  createTeamMember,
  deleteTeamMember,
  listTeamMembers,
  listTeamRoles,
  updateTeamMember,
} from '@/features/team/api';
import { TeamMemberFormModal } from '@/features/team/components/TeamMemberFormModal';
import type { TeamMember, TeamRoleOption } from '@/features/team/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  DataTable,
  TaskCard,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';

export function TeamMembersCard() {
  const toast = useToast();
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.TEAM_READ);
  const canCreate = can(PERMISSIONS.TEAM_CREATE);
  const canUpdate = can(PERMISSIONS.TEAM_UPDATE);
  const canDelete = can(PERMISSIONS.TEAM_DELETE);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<TeamRoleOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      const [team, roleList] = await Promise.all([
        listTeamMembers(),
        listTeamRoles(),
      ]);
      setMembers(team);
      setRoles(roleList);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    if (canRead) void reload();
  }, [canRead]);

  if (!canRead) {
    return <p className="muted">لا توجد صلاحية لعرض الفريق.</p>;
  }

  const showActions = canUpdate || canDelete;

  const columns: Column<TeamMember>[] = [
    { key: 'name', header: 'الاسم', render: (r) => r.name },
    { key: 'username', header: 'اسم الدخول', render: (r) => r.username },
    {
      key: 'status',
      header: 'الحالة',
      render: (r) => (
        <span className={`badge ${r.status === 'ACTIVE' ? 'ok' : ''}`}>
          {r.status === 'ACTIVE' ? 'نشط' : 'موقوف'}
        </span>
      ),
    },
    {
      key: 'roles',
      header: 'الأدوار',
      render: (r) => r.roles.map((role) => role.name).join('، ') || '—',
    },
  ];

  if (showActions) {
    columns.push({
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="row-actions">
          {canUpdate ? (
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                setEditing(r);
                setModalOpen(true);
              }}
            >
              تعديل
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                void (async () => {
                  if (!confirm(`هل تريد حذف العضو «${r.name}»؟`)) return;
                  try {
                    await notifyMutation(
                      toast,
                      () => deleteTeamMember(r.id),
                      { success: 'تم حذف العضو' },
                    );
                    await reload();
                  } catch {
                    /* toast */
                  }
                })();
              }}
            >
              حذف
            </button>
          ) : null}
        </div>
      ),
    });
  }

  return (
    <>
      <TaskCard
        title="أعضاء الفريق"
        actions={
          canCreate ? (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              إضافة عضو
            </button>
          ) : null
        }
      >
        {error ? <p className="error">{error}</p> : null}
        <DataTable
          columns={columns}
          rows={members}
          rowKey={(r) => r.id}
          emptyText="لا يوجد أعضاء"
        />
      </TaskCard>

      <TeamMemberFormModal
        open={modalOpen}
        roles={roles}
        member={editing}
        busy={busy}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={async (payload) => {
          setBusy(true);
          try {
            if (editing) {
              await notifyMutation(
                toast,
                () =>
                  updateTeamMember(editing.id, {
                    name: payload.name,
                    status: payload.status,
                    roleIds: payload.roleIds,
                    ...(payload.password.trim()
                      ? { password: payload.password.trim() }
                      : {}),
                  }),
                { success: 'تم تحديث العضو' },
              );
            } else {
              await notifyMutation(
                toast,
                () =>
                  createTeamMember({
                    name: payload.name,
                    username: payload.username,
                    password: payload.password,
                    roleIds: payload.roleIds,
                  }),
                { success: 'تم إضافة العضو' },
              );
            }
            setModalOpen(false);
            setEditing(null);
            await reload();
          } catch {
            /* toast */
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
