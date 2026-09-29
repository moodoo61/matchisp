'use client';

import { deleteAgent, updateAgent } from '@/features/partners/api';
import type { Agent } from '@/features/partners/types';
import { agentMapsUrl } from '@/features/partners/types';
import {
  DataTable,
  IconButton,
  IconEdit,
  IconEye,
  IconEyeOff,
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
  onChanged: () => Promise<void>;
};

export function AgentsTable({
  agents,
  canUpdate,
  canDelete,
  onEdit,
  onChanged,
}: Props) {
  const toast = useToast();
  const showActions = canUpdate || canDelete;

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
      key: 'region',
      header: 'المنطقة',
      render: (row) => row.region || '—',
    },
    {
      key: 'address',
      header: 'العنوان',
      render: (row) => row.address,
    },
    {
      key: 'phone',
      header: 'رقم الهاتف',
      render: (row) => row.phone,
    },
    {
      key: 'order',
      header: 'الترتيب',
      render: (row) => row.sortOrder,
    },
    {
      key: 'api',
      header: 'API',
      render: (row) => (
        <span className={`badge ${row.isPublic ? 'ok' : ''}`}>
          {row.isPublic ? 'ظاهر' : 'مخفي'}
        </span>
      ),
    },
    {
      key: 'location',
      header: 'الموقع',
      render: (row) =>
        row.latitude != null && row.longitude != null ? (
          <a
            href={agentMapsUrl(row.latitude, row.longitude)}
            target="_blank"
            rel="noreferrer"
          >
            خريطة
          </a>
        ) : (
          '—'
        ),
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
              {row.isPublic ? <IconEye /> : <IconEyeOff />}
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
    });
  }

  return <DataTable columns={columns} rows={agents} rowKey={(r) => r.id} />;
}
