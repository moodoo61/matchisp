'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  PUBLIC_STATUS_ENDPOINTS,
  createStatusService,
  deleteStatusService,
  listStatusServices,
  updateStatusService,
} from '@/features/page_management/api';
import { useCardFlag } from '@/features/page_management/hooks/useCardFlag';
import { usePermissions } from '@/lib/usePermissions';
import type { StatusService } from '@/features/page_management/types';
import {
  CardEnableToggle,
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
import { StatusServiceModal } from './StatusServiceModal';

/** بطاقة إدارة خدمات صفحة الحالة */
export function StatusServicesCard() {
  const toast = useToast();
  const [items, setItems] = useState<StatusService[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<StatusService | 'new' | null>(null);
  const flag = useCardFlag('status_services');
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PAGE_STATUS_SERVICES_READ);
  const canCreate = can(PERMISSIONS.PAGE_STATUS_SERVICES_CREATE);
  const canUpdate = can(PERMISSIONS.PAGE_STATUS_SERVICES_UPDATE);
  const canDelete = can(PERMISSIONS.PAGE_STATUS_SERVICES_DELETE);
  const canToggle = can(PERMISSIONS.PAGE_STATUS_SERVICES_TOGGLE);

  async function reload() {
    try {
      setItems(await listStatusServices());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    reload();
  }, []);

  if (!canRead) return null;

  const columns: Column<StatusService>[] = [
    {
      key: 'preview',
      header: 'الصورة',
      render: (row) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.imageUrl} alt="" className="table-thumb" />
      ),
    },
    {
      key: 'name',
      header: 'الاسم',
      render: (row) => row.name,
    },
    {
      key: 'link',
      header: 'الرابط',
      render: (row) => (
        <span className="link-cell" title={row.linkUrl}>
          {row.linkUrl}
        </span>
      ),
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
    ...(canUpdate || canToggle || canDelete
      ? [
          {
            key: 'actions',
            header: '',
            className: 'col-actions',
            render: (row: StatusService) => (
              <div className="row-actions">
                {canUpdate ? (
                  <IconButton label="تعديل" onClick={() => setModal(row)}>
                    <IconEdit />
                  </IconButton>
                ) : null}
                {canToggle ? (
                  <IconButton
                    label={row.isActive ? 'تعطيل' : 'تفعيل'}
                    onClick={async () => {
                      try {
                        await notifyMutation(
                          toast,
                          () =>
                            updateStatusService(row.id, {
                              isActive: !row.isActive,
                            }),
                          {
                            success: row.isActive
                              ? 'تم تعطيل الخدمة'
                              : 'تم تفعيل الخدمة',
                          },
                        );
                        await reload();
                      } catch {
                        // الإشعار عبر notifyMutation
                      }
                    }}
                  >
                    <IconToggle />
                  </IconButton>
                ) : null}
                {canDelete ? (
                  <IconButton
                    label="حذف"
                    tone="danger"
                    onClick={async () => {
                      if (!confirm('حذف الخدمة؟')) return;
                      try {
                        await notifyMutation(
                          toast,
                          () => deleteStatusService(row.id),
                          { success: 'تم حذف الخدمة بنجاح' },
                        );
                        await reload();
                      } catch {
                        // الإشعار عبر notifyMutation
                      }
                    }}
                  >
                    <IconTrash />
                  </IconButton>
                ) : null}
              </div>
            ),
          } satisfies Column<StatusService>,
        ]
      : []),
  ];

  return (
    <>
      {error || flag.error ? (
        <div className="error">{error || flag.error}</div>
      ) : null}
      <TaskCard
        title="الخدمات"
        enabled={flag.enabled}
        actions={
          <>
            {canToggle ? (
              <CardEnableToggle
                enabled={flag.enabled}
                busy={flag.busy}
                onToggle={flag.toggle}
              />
            ) : null}
            <CopyApiIcon path={PUBLIC_STATUS_ENDPOINTS.services} />
            {canCreate ? (
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
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          emptyText="لا توجد خدمات"
        />
      </TaskCard>

      {canCreate || canUpdate ? (
        <StatusServiceModal
          state={modal}
          onClose={() => setModal(null)}
          onSave={async (input) => {
            if (modal === 'new') await createStatusService(input);
            else if (modal) await updateStatusService(modal.id, input);
            setModal(null);
            await reload();
          }}
        />
      ) : null}
    </>
  );
}
