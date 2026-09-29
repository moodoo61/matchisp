'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { api } from '@/lib/api';

type Permission = { id: string; code: string; name: string };
type Role = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  usersCount: number;
  permissions: Permission[];
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    permissionIds: [] as string[],
  });

  async function load() {
    try {
      const [roleList, permList] = await Promise.all([
        api<Role[]>('/roles'),
        api<Permission[]>('/roles/permissions'),
      ]);
      setRoles(roleList);
      setPermissions(permList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api('/roles', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({ code: '', name: '', description: '', permissionIds: [] });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  return (
    <AuthGate>
      <AdminShell>
        <div className="toolbar">
          <div>
            <h1 className="page-title">الأدوار والصلاحيات</h1>
            <p className="page-sub">RBAC — منح صلاحيات بصيغة resource:action</p>
          </div>
          <button
            className="btn"
            type="button"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'إلغاء' : 'دور جديد'}
          </button>
        </div>

        {error ? <div className="error">{error}</div> : null}

        {showForm ? (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <form className="form" onSubmit={onCreate}>
              <label>
                الرمز (إنجليزي)
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
              </label>
              <label>
                الاسم
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label>
                الوصف
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>
              <label>
                الصلاحيات
                <select
                  multiple
                  value={form.permissionIds}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      permissionIds: Array.from(e.target.selectedOptions).map(
                        (o) => o.value,
                      ),
                    })
                  }
                  style={{ minHeight: 140 }}
                >
                  {permissions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn" type="submit">
                حفظ الدور
              </button>
            </form>
          </div>
        ) : null}

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
              {roles.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.name}{' '}
                    {r.isSystem ? <span className="badge ok">نظامي</span> : null}
                  </td>
                  <td>
                    <code>{r.code}</code>
                  </td>
                  <td>{r.usersCount}</td>
                  <td>{r.permissions.map((p) => p.code).join('، ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminShell>
    </AuthGate>
  );
}
