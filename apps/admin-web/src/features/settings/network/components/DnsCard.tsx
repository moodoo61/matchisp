'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import { getDns } from '@/features/settings/network/api';
import type { NetworkDnsInfo } from '@/features/settings/network/types';
import { usePermissions } from '@/lib/usePermissions';
import { IconButton, TaskCard } from '@/shared/ui';

export function DnsCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.NETWORK_DNS_READ);
  const [data, setData] = useState<NetworkDnsInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      setData(await getDns());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب DNS');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
  }, [canRead, reload]);

  if (!canRead) return null;

  return (
    <TaskCard
      title="DNS"
      actions={
        <IconButton
          label="تحديث"
          onClick={() => void reload()}
          disabled={busy}
        >
          ↻
        </IconButton>
      }
    >
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p className="muted">جاري القراءة…</p> : null}
      {data ? (
        <div className="net-dns">
          <p className="muted">المصدر: {data.mode}</p>
          <div className="net-dns-grid">
            <div>
              <h4>خوادم الأسماء</h4>
              {data.servers.length ? (
                <ul>
                  {data.servers.map((s) => (
                    <li key={s}>
                      <span className="mono" dir="ltr">
                        {s}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">لا يوجد</p>
              )}
            </div>
            <div>
              <h4>نطاقات البحث</h4>
              {data.search.length ? (
                <ul>
                  {data.search.map((s) => (
                    <li key={s}>
                      <span className="mono" dir="ltr">
                        {s}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">لا يوجد</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </TaskCard>
  );
}
