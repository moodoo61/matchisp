'use client';

import { deleteAgent, updateAgent } from '@/features/partners/api';
import type { Agent } from '@/features/partners/types';
import {
  DataTable,
  IconButton,
  IconEdit,
  IconInfo,
  IconTrash,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';

type Props = {
  agents: Agent[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (agent: Agent) => void;
  onDetails: (agent: Agent) => void;
  onChanged: () => Promise<void>;
};

export function AgentsTable({
  agents,
  canUpdate,
  canDelete,
  onEdit,
  onDetails,
  onChanged,
}: Props) {
  const toast = useToast();

  const columns: Column<Agent>[] = [
    {
      key: 'name',
      header: 'اسم الوكيل',
      render: (row) => row.name,
    },
    {
      key: 'shopName',
      header: 'اسم المحل',
      render: (row) => row.shopName,
    },
    {
      key: 'phone',
      header: 'رقم الهاتف',
      render: (row) => row.phone,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="row-actions">
          <IconButton label="تفاصيل" onClick={() => onDetails(row)}>
            <IconInfo />
          </IconButton>
          {canUpdate ? (
            <IconButton label="تعديل" onClick={() => onEdit(row)}>
              <IconEdit />
            </IconButton>
          ) : null}
          {canUpdate ? (
            <IconButton
              label={row.isPublic ? 'إخفاء من API' : 'إظهار في API'}
              tone={row.isPublic ? 'accent' : 'default'}
              onClick={() => {
                void (async () => {
                  try {
                    await notifyMutation(
                      toast,
                      () =>
                        updateAgent(row.id, { isPublic: !row.isPublic }),
                      {
                        success: row.isPublic
                          ? 'تم إخفاء الوكيل من API'
                          : 'تم إظهار الوكيل في API',
                      },
                    );
                    await onChanged();
                  } catch {
                    /* toast */
                  }
                })();
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                api
              </span>
            </IconButton>
          ) : null}
          {canDelete ? (
            <IconButton
              label="حذف"
              tone="danger"
              onClick={() => {
                if (!confirm(`حذف الوكيل «${row.name}»؟`)) return;
                void (async () => {
                  try {
                    await notifyMutation(
                      toast,
                      () => deleteAgent(row.id),
                      { success: 'تم حذف الوكيل' },
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
    },
  ];

  return <DataTable columns={columns} rows={agents} rowKey={(r) => r.id} />;
}
