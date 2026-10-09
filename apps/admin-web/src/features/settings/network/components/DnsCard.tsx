'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import { getDns, setDns } from '@/features/settings/network/api';
import type { NetworkDnsInfo } from '@/features/settings/network/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  IconButton,
  TaskCard,
  notifyMutation,
  useToast,
} from '@/shared/ui';

export function DnsCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.NETWORK_DNS_READ);
  const canManage = can(PERMISSIONS.NETWORK_DNS_MANAGE);
  const toast = useToast();

  const [data, setData] = useState<NetworkDnsInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [serversText, setServersText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [device, setDevice] = useState('');

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      const next = await getDns();
      setData(next);
      setServersText(next.servers.join('\n'));
      setSearchText(next.search.join('\n'));
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

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    const servers = splitLines(serversText);
    const search = splitLines(searchText);
    setBusy(true);
    try {
      await notifyMutation(
        toast,
        () =>
          setDns({
            servers,
            search,
            device: device.trim() || undefined,
          }),
        { success: 'تم حفظ إعدادات DNS' },
      );
      await reload();
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  if (!canRead) return null;

  return (
    <div className="task-stack">
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
            <p className="muted">المصدر التشغيلي: {data.mode}</p>
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

      {canManage ? (
        <TaskCard title="ضبط DNS (دائم عبر NetworkManager)">
          <form className="form net-route-form" onSubmit={submit}>
            <label>
              خوادم DNS (سطر لكل عنوان)
              <textarea
                dir="ltr"
                rows={3}
                value={serversText}
                onChange={(e) => setServersText(e.target.value)}
                placeholder={'8.8.8.8\n1.1.1.1'}
              />
            </label>
            <label>
              نطاقات البحث (اختياري)
              <textarea
                dir="ltr"
                rows={2}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="lan.local"
              />
            </label>
            <label>
              المنفذ (اختياري)
              <input
                dir="ltr"
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                placeholder="eno1"
              />
            </label>
            <p className="muted">
              يُحفظ على ملف اتصال NetworkManager ويُطبَّق بعد الإقلاع.
            </p>
            <button className="btn" type="submit" disabled={busy}>
              حفظ
            </button>
          </form>
        </TaskCard>
      ) : null}
    </div>
  );
}

function splitLines(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
