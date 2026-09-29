'use client';

import { deleteSportTeam } from '@/features/live/sports_events/api';
import type { SportTeam } from '@/features/live/sports_events/types';
import { SPORT_TEAM_TYPE_LABELS } from '@/features/live/sports_events/types';
import {
  DataTable,
  IconButton,
  IconEdit,
  IconTrash,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';

type Props = {
  teams: SportTeam[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (team: SportTeam) => void;
  onChanged: () => Promise<void>;
};

export function TeamsTable({
  teams,
  canUpdate,
  canDelete,
  onEdit,
  onChanged,
}: Props) {
  const toast = useToast();
  const showActions = canUpdate || canDelete;

  const columns: Column<SportTeam>[] = [
    {
      key: 'logo',
      header: 'الشعار',
      render: (row) =>
        row.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.logoUrl}
            alt={row.name}
            style={{ width: 36, height: 36, objectFit: 'contain' }}
          />
        ) : (
          '—'
        ),
    },
    {
      key: 'name',
      header: 'الاسم',
      render: (row) => row.name,
    },
    {
      key: 'type',
      header: 'النوع',
      render: (row) => SPORT_TEAM_TYPE_LABELS[row.type],
    },
  ];

  if (showActions) {
    columns.push({
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="row-actions">
          {canUpdate ? (
            <IconButton label="تعديل" onClick={() => onEdit(row)}>
              <IconEdit />
            </IconButton>
          ) : null}
          {canDelete ? (
            <IconButton
              label="حذف"
              tone="danger"
              onClick={() => {
                if (!confirm(`حذف الفريق «${row.name}»؟`)) return;
                void (async () => {
                  try {
                    await notifyMutation(
                      toast,
                      () => deleteSportTeam(row.id),
                      { success: 'تم حذف الفريق' },
                    );
                    await onChanged();
                  } catch {
                    /* toast */
                  }
                })();
              }}
            >
              <IconTrash />
            </IconButton>
          ) : null}
        </div>
      ),
    });
  }

  return <DataTable columns={columns} rows={teams} rowKey={(r) => r.id} />;
}
