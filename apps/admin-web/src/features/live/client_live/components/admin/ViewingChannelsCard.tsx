'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  listViewingPageChannels,
  setViewingChannelVisibility,
} from '@/features/live/client_live/api';
import type {
  ViewingPageAdminChannel,
  ViewingPageChannelsResponse,
} from '@/features/live/client_live/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  CardEnableToggle,
  DataTable,
  TaskCard,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';

function onlineLabel(online: 0 | 1 | 2 | null, active: boolean) {
  if (active || online === 1) return 'مباشر';
  if (online === 2 || online === 0) return 'متوقف';
  return '—';
}

function onlineBadgeClass(online: 0 | 1 | 2 | null, active: boolean) {
  if (active || online === 1) return 'ok';
  if (online === 2 || online === 0) return 'progress';
  return '';
}

/** قنوات صفحة المشاهدة: جدول أعمدة + إظهار/إخفاء */
export function ViewingChannelsCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.LIVE_VIEWING_PAGE_READ);
  const canToggle = can(PERMISSIONS.LIVE_VIEWING_PAGE_TOGGLE);
  const toast = useToast();
  const [data, setData] = useState<ViewingPageChannelsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const next = await listViewingPageChannels();
      setData(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب القنوات');
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
  }, [canRead, reload]);

  const channels = useMemo(() => {
    if (!data) return [] as ViewingPageAdminChannel[];
    return data.sections.flatMap((section) => section.channels);
  }, [data]);

  const toggleVisible = async (id: string, visible: boolean) => {
    if (!canToggle) return;
    setBusyId(id);
    try {
      await notifyMutation(
        toast,
        () => setViewingChannelVisibility(id, visible),
        {
          success: visible
            ? 'تم إظهار القناة للعملاء'
            : 'تم إخفاء القناة عن العملاء',
        },
      );
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((section) => ({
            ...section,
            channels: section.channels.map((channel) =>
              channel.id === id ? { ...channel, visible } : channel,
            ),
          })),
        };
      });
    } catch {
      /* toast */
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<ViewingPageAdminChannel>[] = [
    {
      key: 'icon',
      header: 'الأيقونة',
      render: (row) =>
        row.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="viewing-channels-thumb"
            src={row.imageUrl}
            alt=""
          />
        ) : (
          <span className="viewing-channels-thumb is-empty" aria-hidden>
            {row.label.slice(0, 1)}
          </span>
        ),
    },
    {
      key: 'label',
      header: 'اسم القناة',
      render: (row) => row.label,
    },
    {
      key: 'section',
      header: 'القسم',
      render: (row) => row.section.label,
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (row) => (
        <span className={`badge ${onlineBadgeClass(row.online, row.active)}`}>
          {onlineLabel(row.online, row.active)}
          {!row.isActive ? ' · غير مفعّلة' : ''}
          {!row.visible ? ' · مخفية' : ''}
        </span>
      ),
    },
    {
      key: 'viewers',
      header: 'المشاهدون',
      render: (row) => row.viewers,
    },
    {
      key: 'actions',
      header: 'الأزرار',
      render: (row) =>
        canToggle ? (
          <CardEnableToggle
            enabled={row.visible}
            busy={busyId === row.id}
            onToggle={() => void toggleVisible(row.id, !row.visible)}
          />
        ) : (
          <span className="muted">{row.visible ? 'ظاهرة' : 'مخفية'}</span>
        ),
    },
  ];

  if (!canRead) return null;

  return (
    <TaskCard title="القنوات">
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p className="muted">جاري التحميل…</p> : null}
      {data ? (
        <div className="viewing-channels">
          <DataTable
            columns={columns}
            rows={channels}
            rowKey={(r) => r.id}
            emptyText="لا توجد أقسام أو قنوات بعد"
          />
          {!canToggle ? (
            <p className="muted">عرض فقط — لا صلاحية تعديل</p>
          ) : null}
        </div>
      ) : null}
    </TaskCard>
  );
}
