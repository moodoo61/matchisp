'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  PUBLIC_SPEED_ENDPOINT,
  deleteSpeedOption,
  listSpeedOptions,
  updateSpeedOption,
} from '@/features/page_management/api';
import { usePermissions } from '@/lib/usePermissions';
import type { SpeedOption } from '@/features/page_management/types';
import {
  CopyApiIcon,
  DataTable,
  IconButton,
  IconEdit,
  IconPlus,
  IconToggle,
  IconTrash,
  TaskCard,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';
import { SpeedOptionModal } from './SpeedOptionModal';

export function SpeedOptionsCard() {
  const toast = useToast();
  const [items, setItems] = useState<SpeedOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<SpeedOption | 'new' | null>(null);
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PAGE_SPEED_READ);
  const canWrite = can(PERMISSIONS.PAGE_SPEED_UPDATE);

  async function reload() {
    try {
      setItems(await listSpeedOptions());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    reload();
  }, []);

  if (!canRead) return null;

  const columns: Column<SpeedOption>[] = [
    {
      key: 'name',
      header: 'الاسم',
      render: (row) => row.name,
    },
    {
      key: 'value',
      header: 'قيمة الراوتر',
      render: (row) => <code>{row.value}</code>,
    },
    {
      key: 'default',
      header: 'افتراضي',
      render: (row) =>
        row.isDefault ? <span className="badge ok">نعم</span> : '—',
    },
    {
      key: 'order',
      header: 'الترتيب',
      render: (row) => row.sortOrder,
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (row) => (
        <span className={`badge ${row.isActive ? 'ok' : ''}`}>
          {row.isActive ? 'نشط' : 'موقوف'}
        </span>
      ),
    },
    ...(canWrite
      ? [
          {
            key: 'actions',
            header: '',
            className: 'col-actions',
            render: (row: SpeedOption) => (
              <div className="row-actions">
                <IconButton label="تعديل" onClick={() => setModal(row)}>
                  <IconEdit />
                </IconButton>
                <IconButton
                  label={row.isActive ? 'تعطيل' : 'تفعيل'}
                  onClick={async () => {
                    try {
                      await notifyMutation(
                        toast,
                        () =>
                          updateSpeedOption(row.id, {
                            isActive: !row.isActive,
                          }),
                        {
                          success: row.isActive
                            ? 'تم تعطيل الخيار'
                            : 'تم تفعيل الخيار',
                        },
                      );
                      await reload();
                    } catch {
                      // notifyMutation
                    }
                  }}
                >
                  <IconToggle />
                </IconButton>
                <IconButton
                  label="حذف"
                  tone="danger"
                  onClick={async () => {
                    if (!confirm('حذف خيار السرعة؟')) return;
                    try {
                      await notifyMutation(
                        toast,
                        () => deleteSpeedOption(row.id),
                        { success: 'تم حذف الخيار' },
                      );
                      await reload();
                    } catch {
                      // notifyMutation
                    }
                  }}
                >
                  <IconTrash />
                </IconButton>
              </div>
            ),
          } satisfies Column<SpeedOption>,
        ]
      : []),
  ];

  return (
    <>
      {error ? <div className="error">{error}</div> : null}
      <TaskCard
        title="خيارات السرعة"
        actions={
          <>
            <CopyApiIcon path={PUBLIC_SPEED_ENDPOINT} />
            {canWrite ? (
              <IconButton
                label="إضافة"
                tone="accent"
                onClick={() => setModal('new')}
              >
                <IconPlus />
              </IconButton>
            ) : null}
          </>
        }
      >
        <p className="muted" style={{ marginBottom: 12 }}>
          تظهر هذه الخيارات في صفحة الدخول والحالة على الراوتر. خيار «كروت
          هوتسبوت» ثابت في صفحة الدخول ولا يُدار من هنا.
        </p>
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          emptyText="لا توجد خيارات سرعة"
        />
      </TaskCard>
      {canWrite ? (
        <SpeedOptionModal
          state={modal}
          onClose={() => setModal(null)}
          onSaved={reload}
        />
      ) : null}
    </>
  );
}
