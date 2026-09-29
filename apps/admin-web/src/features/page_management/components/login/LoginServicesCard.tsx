'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  PUBLIC_LOGIN_ENDPOINTS,
  deleteLoginService,
  listLoginServices,
  updateLoginService,
} from '@/features/page_management/api';
import { useCardFlag } from '@/features/page_management/hooks/useCardFlag';
import { usePermissions } from '@/lib/usePermissions';
import type { LoginService } from '@/features/page_management/types';
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
import { LoginServiceModal } from './LoginServiceModal';

export function LoginServicesCard() {
  const toast = useToast();
  const [items, setItems] = useState<LoginService[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<LoginService | 'new' | null>(null);
  const flag = useCardFlag('login_services');
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PAGE_LOGIN_SERVICES_READ);
  const canManage = can(PERMISSIONS.PAGE_LOGIN_SERVICES_MANAGE);
  async function reload() {
    try {
      setItems(await listLoginServices());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    reload();
  }, []);

  if (!canRead) return null;

  const columns: Column<LoginService>[] = [
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
    ...(canManage
      ? [
    {
      key: 'actions',
      header: '',
      className: 'col-actions',
      render: (row: LoginService) => (
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
                  () => updateLoginService(row.id, { isActive: !row.isActive }),
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
          <IconButton
            label="حذف"
            tone="danger"
            onClick={async () => {
              if (!confirm('حذف الخدمة؟')) return;
              try {
                await notifyMutation(
                  toast,
                  () => deleteLoginService(row.id),
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
        </div>
      ),
    } satisfies Column<LoginService>,
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
            {canManage ? (
              <CardEnableToggle
                enabled={flag.enabled}
                busy={flag.busy}
                onToggle={flag.toggle}
              />
            ) : null}
            <CopyApiIcon path={PUBLIC_LOGIN_ENDPOINTS.services} />
            {canManage ? (
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
      <LoginServiceModal
        state={modal}
        onClose={() => setModal(null)}
        onSaved={reload}
      />
    </>
  );
}
