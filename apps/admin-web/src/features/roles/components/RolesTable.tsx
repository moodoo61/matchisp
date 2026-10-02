'use client';

import type { RoleRow } from '../types';

type Props = {
  roles: RoleRow[];
};

export function RolesTable({ roles }: Props) {
  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>الرمز</th>
            <th>المستخدمون</th>
            <th>الصلاحيات</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
