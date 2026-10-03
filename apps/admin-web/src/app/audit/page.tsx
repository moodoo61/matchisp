'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { api } from '@/lib/api';

type AuditPage = {
  items: Array<{
    id: string;
    action: string;
    resource: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
    actor?: { name: string; username: string } | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
};

function auditDetail(row: AuditPage['items'][number]): string {
  const meta = row.metadata;
  if (!meta || typeof meta !== 'object') return '—';
  if (typeof meta.message === 'string' && meta.message.trim()) {
    return meta.message;
  }
  if (typeof meta.path === 'string') {
    const status = typeof meta.status === 'number' ? ` (${meta.status})` : '';
    return `${meta.method ?? ''} ${meta.path}${status}`.trim();
  }
  if (typeof meta.count === 'number' && meta.reason === 'channel_delete') {
    return `مسح ${meta.count} مباراة مع حذف القناة`;
  }
  return '—';
}

export default function AuditPage() {
  const [data, setData] = useState<AuditPage | null>(null);
  const [resource, setResource] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load(filterResource = resource) {
    try {
      const q = new URLSearchParams({ page: '1', pageSize: '50' });
      if (filterResource) q.set('resource', filterResource);
      const result = await api<AuditPage>(`/audit?${q.toString()}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthGate>
      <AdminShell>
        <h1 className="page-title">سجلات التدقيق</h1>
        <p className="page-sub">تتبع الإجراءات على موارد النظام</p>

        <div className="toolbar">
          <form
            className="form"
            style={{ maxWidth: 'none', gridTemplateColumns: '1fr auto', width: '100%' }}
            onSubmit={(e) => {
              e.preventDefault();
              load();
            }}
          >
            <label style={{ margin: 0 }}>
              تصفية حسب المورد
              <input
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                placeholder="team / roles / auth"
              />
            </label>
            <button className="btn" type="submit" style={{ alignSelf: 'end' }}>
              تطبيق
            </button>
          </form>
        </div>

        {error ? <div className="error">{error}</div> : null}

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>الفاعل</th>
                <th>الإجراء</th>
                <th>المورد</th>
                <th>التفاصيل</th>
                <th>الوقت</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((row) => (
                <tr key={row.id}>
                  <td>{row.actor?.name ?? '—'}</td>
                  <td>{row.action}</td>
                  <td>{row.resource}</td>
                  <td>
                    <span title={row.resourceId ?? undefined}>
                      {auditDetail(row)}
                    </span>
                  </td>
                  <td>{new Date(row.createdAt).toLocaleString('ar')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data ? (
            <p className="page-sub" style={{ marginTop: '1rem', marginBottom: 0 }}>
              الإجمالي: {data.total}
            </p>
          ) : null}
        </div>
      </AdminShell>
    </AuthGate>
  );
}
