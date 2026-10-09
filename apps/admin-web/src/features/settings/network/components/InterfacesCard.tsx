'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  adoptInterfaceNm,
  listInterfaces,
  removeInterfaceAddress,
  setInterfaceState,
} from '@/features/settings/network/api';
import type {
  InterfacesInventory,
  NetworkInterface,
} from '@/features/settings/network/types';
import {
  ifaceStateLabel,
  nmModeLabel,
  nmModeTone,
} from '@/features/settings/network/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  DataTable,
  IconButton,
  TaskCard,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';
import { AddAddressModal } from './AddAddressModal';

export function InterfacesCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.NETWORK_INTERFACES_READ);
  const canManage = can(PERMISSIONS.NETWORK_INTERFACES_MANAGE);
  const toast = useToast();

  const [data, setData] = useState<InterfacesInventory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [addTarget, setAddTarget] = useState<NetworkInterface | null>(null);

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      setData(await listInterfaces());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب المنافذ');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
  }, [canRead, reload]);

  async function toggleState(row: NetworkInterface) {
    if (!canManage || !row.canControl) return;
    const next = row.adminUp ? 'down' : 'up';
    if (
      !confirm(
        next === 'down'
          ? `إيقاف المنفذ ${row.ifName}؟ قد تفقد الاتصال إن كان هذا منفذ الإدارة.`
          : `تشغيل المنفذ ${row.ifName}؟`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await notifyMutation(
        toast,
        () => setInterfaceState(row.ifName, next),
        {
          success:
            next === 'up'
              ? `تم تشغيل ${row.ifName}`
              : `تم إيقاف ${row.ifName}`,
        },
      );
      await reload();
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  async function removeAddr(row: NetworkInterface, cidr: string) {
    if (!canManage || !row.canControl) return;
    if (!confirm(`حذف العنوان ${cidr} من ${row.ifName}؟`)) return;
    setBusy(true);
    try {
      await notifyMutation(
        toast,
        () => removeInterfaceAddress(row.ifName, cidr),
        { success: `تم حذف ${cidr}` },
      );
      await reload();
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  async function adoptNm(row: NetworkInterface) {
    if (!canManage || !row.canControl || !row.canAdoptNm) return;
    if (
      !confirm(
        `تحويل ${row.ifName} إلى إدارة NetworkManager الدائمة (ملف match-${row.ifName})؟\n` +
          'سيُنسخ العنوان الحالي ويُحفظ تحت /etc ليبقى بعد الإقلاع.',
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await notifyMutation(toast, () => adoptInterfaceNm(row.ifName), {
        success: `تم تحويل ${row.ifName} للطريقة الدائمة`,
      });
      await reload();
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  if (!canRead) return null;

  const columns: Column<NetworkInterface>[] = [
    {
      key: 'name',
      header: 'المنفذ',
      render: (row) => (
        <div className="net-cell-stack">
          <strong className="mono" dir="ltr">
            {row.ifName}
          </strong>
          {row.mac ? (
            <span className="muted mono" dir="ltr">
              {row.mac}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'state',
      header: 'الحالة',
      render: (row) => (
        <span
          className={`status-pill status-${
            row.adminUp && row.operState === 'UP'
              ? 'ok'
              : row.adminUp
                ? 'degraded'
                : 'missing'
          }`}
          title={`oper=${row.operState} admin=${row.adminUp ? 'up' : 'down'}`}
        >
          {ifaceStateLabel(row)}
        </span>
      ),
    },
    {
      key: 'nm',
      header: 'الإدارة',
      render: (row) => (
        <div className="net-cell-stack">
          <span
            className={`status-pill status-${nmModeTone(row.nmMode)}`}
            title={
              [
                row.nmConnection ? `اتصال: ${row.nmConnection}` : null,
                row.nmMatchProfile ? `ملف: ${row.nmMatchProfile}` : null,
                row.nmPersistent ? 'دائم (/etc)' : 'غير دائم',
              ]
                .filter(Boolean)
                .join(' · ') || undefined
            }
          >
            {nmModeLabel(row.nmMode)}
          </span>
          {row.nmMode === 'match' && row.nmPersistent ? (
            <span className="muted net-nm-hint">match + /etc</span>
          ) : null}
          {row.nmMode === 'other' ? (
            <span className="muted net-nm-hint">يتطلب تحويلاً</span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'mtu',
      header: 'MTU',
      className: 'db-num',
      render: (row) => row.mtu || '—',
    },
    {
      key: 'addrs',
      header: 'العناوين',
      render: (row) => {
        const v4 = row.addresses.filter((a) => a.family === 'inet');
        if (!v4.length) return <span className="muted">—</span>;
        return (
          <ul className="net-addr-list">
            {v4.map((a) => (
              <li key={a.cidr}>
                <span className="mono" dir="ltr">
                  {a.cidr}
                </span>
                {canManage && row.canControl ? (
                  <button
                    type="button"
                    className="btn danger btn-sm"
                    disabled={busy}
                    onClick={() => void removeAddr(row, a.cidr)}
                  >
                    حذف
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'col-actions',
      render: (row) => {
        if (!canManage || !row.canControl) {
          return <span className="muted">محمي</span>;
        }
        return (
          <div className="row-actions">
            <button
              type="button"
              className="btn secondary btn-sm"
              disabled={busy}
              onClick={() => void toggleState(row)}
            >
              {row.adminUp ? 'إيقاف' : 'تشغيل'}
            </button>
            <button
              type="button"
              className="btn secondary btn-sm"
              disabled={busy}
              onClick={() => setAddTarget(row)}
            >
              إضافة عنوان
            </button>
            {row.canAdoptNm ? (
              <button
                type="button"
                className="btn btn-sm"
                disabled={busy}
                onClick={() => void adoptNm(row)}
                title="إنشاء ملف match-* دائم تحت NetworkManager"
              >
                تحويل لـ NM دائم
              </button>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <TaskCard
        title="المنافذ والعنونة"
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
        <p className="muted net-nm-legend">
          <span className="status-pill status-ok">NM دائم</span>
          = ملف <span className="mono">match-*</span> تحت NetworkManager ·{' '}
          <span className="status-pill status-degraded">NM / netplan</span>
          = يحتاج زر التحويل للاستمرارية بعد الإقلاع
        </p>
        {error ? <p className="error">{error}</p> : null}
        {!data && !error ? <p className="muted">جاري القراءة…</p> : null}
        {data ? (
          <DataTable
            columns={columns}
            rows={data.interfaces}
            rowKey={(r) => r.ifName}
            emptyText="لا توجد منافذ"
          />
        ) : null}
      </TaskCard>

      <AddAddressModal
        iface={addTarget}
        onClose={() => setAddTarget(null)}
        onDone={reload}
      />
    </>
  );
}
