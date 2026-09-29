'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { api } from '@/lib/api';

type Role = { id: string; code: string; name: string };
type Member = {
  id: string;
  name: string;
  username: string;
  status: string;
  roles: Role[];
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    roleIds: [] as string[],
  });

  async function load() {
    try {
      const [team, roleList] = await Promise.all([
        api<Member[]>('/team'),
        api<Array<{ id: string; name: string }>>('/roles'),
      ]);
      setMembers(team);
      setRoles(roleList);
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
      await api('/team', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({ name: '', username: '', password: '', roleIds: [] });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  async function removeMember(id: string) {
    if (!confirm('هل تريد حذف هذا العضو؟')) return;
    try {
      await api(`/team/${id}`, { method: 'DELETE' });
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
            <h1 className="page-title">الفريق</h1>
            <p className="page-sub">إدارة أعضاء فريق العمل</p>
          </div>
          <button
            className="btn"
            type="button"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'إلغاء' : 'إضافة عضو'}
          </button>
        </div>

        {error ? <div className="error">{error}</div> : null}

        {showForm ? (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <form className="form" onSubmit={onCreate}>
              <label>
                الاسم
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label>
                اسم الدخول
                <input
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                كلمة المرور
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                الأدوار
                <select
                  multiple
                  value={form.roleIds}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      roleIds: Array.from(e.target.selectedOptions).map(
                        (o) => o.value,
                      ),
                    })
                  }
                  style={{ minHeight: 90 }}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn" type="submit">
                حفظ
              </button>
            </form>
          </div>
        ) : null}

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>اسم الدخول</th>
                <th>الحالة</th>
                <th>الأدوار</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.username}</td>
                  <td>
                    <span className={`badge ${m.status === 'ACTIVE' ? 'ok' : ''}`}>
                      {m.status === 'ACTIVE' ? 'نشط' : 'موقوف'}
                    </span>
                  </td>
                  <td>{m.roles.map((r) => r.name).join('، ') || '—'}</td>
                  <td>
                    <button
                      className="btn danger"
                      type="button"
                      onClick={() => removeMember(m.id)}
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminShell>
    </AuthGate>
  );
}
