'use client';

import { deleteSportMatch } from '@/features/live/sports_events/api';
import type { SportMatch } from '@/features/live/sports_events/types';
import { formatKickoff } from '@/features/live/sports_events/utils/datetime';
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
  matches: SportMatch[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (match: SportMatch) => void;
  onChanged: () => Promise<void>;
};

export function MatchesTable({
  matches,
  canUpdate,
  canDelete,
  onEdit,
  onChanged,
}: Props) {
  const toast = useToast();
  const showActions = canUpdate || canDelete;

  const columns: Column<SportMatch>[] = [
    {
      key: 'tournament',
      header: 'البطولة',
      render: (row) => row.tournament,
    },
    {
      key: 'home',
      header: 'الفريق الأول',
      render: (row) => row.homeTeam?.name ?? '—',
    },
    {
      key: 'away',
      header: 'الفريق الثاني',
      render: (row) => row.awayTeam?.name ?? '—',
    },
    {
      key: 'kickoff',
      header: 'الموعد',
      render: (row) => formatKickoff(row.kickoffAt),
    },
    {
      key: 'channel',
      header: 'القناة',
      render: (row) => row.channel?.label ?? '—',
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
                if (
                  !confirm(
                    `حذف مباراة «${row.homeTeam?.name} × ${row.awayTeam?.name}»؟`,
                  )
                ) {
                  return;
                }
                void (async () => {
                  try {
                    await notifyMutation(
                      toast,
                      () => deleteSportMatch(row.id),
                      { success: 'تم حذف المباراة' },
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

  return <DataTable columns={columns} rows={matches} rowKey={(r) => r.id} />;
}
