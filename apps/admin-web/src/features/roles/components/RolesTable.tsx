'use client';

import type { RoleRow } from '../types';

type Props = {
  roles: RoleRow[];
  canManage?: boolean;
  onEdit?: (role: RoleRow) => void;
  onDelete?: (role: RoleRow) => void;
};

export function RolesTable({
  roles,
  canManage = false,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>الرمز</th>
            <th>المستخدمون</th>
            <th>الصلاحيات</th>
            {canManage ? <th></th> : null}
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id}>
              <td>
                {role.name}{' '}
                {role.isSystem ? <span className="badge ok">نظامي</span> : null}
              </td>
              <td>
                <code>{role.code}</code>
              </td>
              <td>{role.usersCount}</td>
              <td>
                <span className="roles-perm-count">
                  {role.permissions.length} صلاحية
                </span>
              </td>
              {canManage ? (
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => onEdit?.(role)}
                    >
                      تعديل
                    </button>
                    {!role.isSystem ? (
                      <button
                        type="button"
                        className="btn danger"
                        onClick={() => onDelete?.(role)}
                        disabled={role.usersCount > 0}
                        title={
                          role.usersCount > 0
                            ? 'الدور مرتبط بمستخدمين'
                            : 'حذف الدور'
                        }
                      >
                        حذف
                      </button>
                    ) : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
