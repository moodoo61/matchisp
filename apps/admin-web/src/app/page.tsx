'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { api } from '@/lib/api';

type Overview = {
  stats: {
    usersTotal: number;
    usersActive: number;
    rolesTotal: number;
    auditToday: number;
  };
  recentAudit: Array<{
    id: string;
    action: string;
    resource: string;
    createdAt: string;
    actor?: { name: string; username: string } | null;
  }>;
  sections: Array<{ key: string; name: string; status: string }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Overview>('/dashboard/overview')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <AuthGate>
      <AdminShell>
        <h1 className="page-title">نظرة عامة</h1>
        <p className="page-sub">إحصائيات النواة وحالة أقسام النظام</p>
        {error ? <div className="error">{error}</div> : null}
        {data ? (
          <>
            <div className="grid-stats">
              <div className="card">
                <p className="stat-label">أعضاء الفريق</p>
                <p className="stat-value">{data.stats.usersTotal}</p>
              </div>
              <div className="card">
                <p className="stat-label">نشطون</p>
                <p className="stat-value">{data.stats.usersActive}</p>
              </div>
              <div className="card">
                <p className="stat-label">الأدوار</p>
                <p className="stat-value">{data.stats.rolesTotal}</p>
              </div>
              <div className="card">
                <p className="stat-label">تدقيق اليوم</p>
                <p className="stat-value">{data.stats.auditToday}</p>
              </div>
            </div>

            <div className="card" style={{ marginBottom: '1rem' }}>
              <h2 style={{ marginTop: 0 }}>أقسام النظام</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>القسم</th>
                    <th>المفتاح</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sections.map((s) => (
                    <tr key={s.key}>
                      <td>{s.name}</td>
                      <td>
                        <code>db_{s.key === 'core' ? 'core' : s.key}</code>
                      </td>
                      <td>
                        <span
                          className={`badge${
                            s.status === 'ready'
                              ? ' ok'
                              : s.status === 'in_progress'
                                ? ' progress'
                                : ''
                          }`}
                        >
                          {s.status === 'ready'
                            ? 'جاهز'
                            : s.status === 'in_progress'
                              ? 'قيد التطوير'
                              : 'هيكل فقط'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h2 style={{ marginTop: 0 }}>آخر سجلات التدقيق</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>الفاعل</th>
                    <th>الإجراء</th>
                    <th>المورد</th>
                    <th>الوقت</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentAudit.map((row) => (
                    <tr key={row.id}>
                      <td>{row.actor?.name ?? '—'}</td>
                      <td>{row.action}</td>
                      <td>{row.resource}</td>
                      <td>{new Date(row.createdAt).toLocaleString('ar')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          !error && <p className="page-sub">جاري التحميل...</p>
        )}
      </AdminShell>
    </AuthGate>
  );
}
