'use client';

import {
  deleteChannel,
  nukeChannelStream,
  stopChannelSessions,
  updateChannel,
} from '@/features/live/api';
import type { Channel } from '@/features/live/types';
import {
  DataTable,
  IconAlwaysOn,
  IconButton,
  IconEdit,
  IconNukeStream,
  IconStopSessions,
  IconTrash,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';
import {
  formatMistBitrate,
  formatMistBytes,
  formatMistDuration,
} from './mist-duration';
import { mistStatusLabel } from './mist-status';

type Props = {
  channels: Channel[];
  canUpdate: boolean;
  canToggle: boolean;
  canControl: boolean;
  canDelete: boolean;
  showSection?: boolean;
  onEdit: (channel: Channel) => void;
  onChanged: () => Promise<void>;
};

export function ChannelsTable({
  channels,
  canUpdate,
  canToggle,
  canControl,
  canDelete,
  showSection = true,
  onEdit,
  onChanged,
}: Props) {
  const toast = useToast();
  const showActions = canUpdate || canToggle || canControl || canDelete;

  const columns: Column<Channel>[] = [
    {
      key: 'label',
      header: 'الاسم',
      render: (row) => row.label,
    },
    {
      key: 'name',
      header: 'name',
      render: (row) => <span className="link-cell">{row.name}</span>,
    },
    ...(showSection
      ? [
          {
            key: 'section',
            header: 'القسم',
            render: (row: Channel) => row.section?.label ?? '—',
          } satisfies Column<Channel>,
        ]
      : []),
    {
      key: 'type',
      header: 'النوع',
      render: (row) => row.type,
    },
    {
      key: 'source',
      header: 'المصدر / الجهاز',
      render: (row) =>
        row.type === 'IPTV'
          ? row.sourceUrl || '—'
          : [row.videoDevice, row.audioDevice].filter(Boolean).join(' · ') ||
            '—',
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (row) => {
        const status = mistStatusLabel(row.mist);
        return (
          <span
            className={`status-pill status-${status.tone}`}
            title={status.detail || undefined}
          >
            {status.text}
          </span>
        );
      },
    },
    {
      key: 'connectedSec',
      header: 'Connected',
      render: (row) => (
        <span dir="ltr">{formatMistDuration(row.mist?.connectedSec)}</span>
      ),
    },
    {
      key: 'downBytes',
      header: 'Data downloaded',
      render: (row) => (
        <span dir="ltr">{formatMistBytes(row.mist?.downBytes)}</span>
      ),
    },
    {
      key: 'downBps',
      header: 'Current bitrate',
      render: (row) => (
        <span dir="ltr">{formatMistBitrate(row.mist?.downBps)}</span>
      ),
    },
    {
      key: 'alwaysOn',
      header: 'دائم',
      render: (row) =>
        row.alwaysOn ? (
          <span className="status-pill status-ok">نعم</span>
        ) : (
          <span className="status-pill status-missing">لا</span>
        ),
    },
    ...(showActions
      ? [
          {
            key: 'actions',
            header: '',
            render: (row: Channel) => (
              <div className="row-actions">
                {canUpdate ? (
                  <IconButton label="تعديل" onClick={() => onEdit(row)}>
                    <IconEdit />
                  </IconButton>
                ) : null}
                {canToggle ? (
                  <IconButton
                    label={
                      row.alwaysOn
                        ? 'تعطيل التشغيل الدائم'
                        : 'تفعيل التشغيل الدائم'
                    }
                    tone={row.alwaysOn ? 'accent' : 'default'}
                    onClick={async () => {
                      try {
                        await notifyMutation(
                          toast,
                          () =>
                            updateChannel(row.id, {
                              alwaysOn: !row.alwaysOn,
                            }),
                          {
                            success: row.alwaysOn
                              ? 'تم تعطيل التشغيل الدائم'
                              : 'تم تفعيل التشغيل الدائم',
                          },
                        );
                        await onChanged();
                      } catch {
                        // الإشعار عُرض عبر notifyMutation
                      }
                    }}
                  >
                    <IconAlwaysOn />
                  </IconButton>
                ) : null}
                {canControl ? (
                  <IconButton
                    label="طرد الجلسات"
                    onClick={async () => {
                      if (
                        !confirm(
                          `طرد جميع جلسات القناة «${row.label}»؟\nسيُقطع البث والمشاهدون الحاليون.`,
                        )
                      ) {
                        return;
                      }
                      try {
                        await notifyMutation(
                          toast,
                          () => stopChannelSessions(row.id),
                          { success: 'تم طرد جلسات القناة' },
                        );
                        await onChanged();
                      } catch {
                        // الإشعار عُرض عبر notifyMutation
                      }
                    }}
                  >
                    <IconStopSessions />
                  </IconButton>
                ) : null}
                {canControl ? (
                  <IconButton
                    label="إيقاف قسري"
                    tone="danger"
                    onClick={async () => {
                      if (
                        !confirm(
                          `إيقاف قسري للقناة «${row.label}»؟\nتنظيف الذاكرة (يفضّل الطرد أولاً).`,
                        )
                      ) {
                        return;
                      }
                      try {
                        await notifyMutation(
                          toast,
                          () => nukeChannelStream(row.id),
                          { success: 'تم الإيقاف القسري للقناة' },
                        );
                        await onChanged();
                      } catch {
                        // الإشعار عُرض عبر notifyMutation
                      }
                    }}
                  >
                    <IconNukeStream />
                  </IconButton>
                ) : null}
                {canDelete ? (
                  <IconButton
                    label="حذف"
                    onClick={async () => {
                      if (!confirm('حذف هذه القناة؟')) return;
                      try {
                        await notifyMutation(
                          toast,
                          () => deleteChannel(row.id),
                          { success: 'تم حذف القناة بنجاح' },
                        );
                        await onChanged();
                      } catch {
                        // الإشعار عُرض عبر notifyMutation
                      }
                    }}
                  >
                    <IconTrash />
                  </IconButton>
                ) : null}
              </div>
            ),
          } satisfies Column<Channel>,
        ]
      : []),
  ];

  if (!channels.length) {
    return <p className="muted">لا توجد قنوات في هذا القسم.</p>;
  }

  return (
    <DataTable columns={columns} rows={channels} rowKey={(r) => r.id} />
  );
}
