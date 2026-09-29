'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  PUBLIC_LOGIN_ENDPOINTS,
  deleteLoginPackage,
  listLoginPackages,
  updateLoginPackage,
} from '@/features/page_management/api';
import { useCardFlag } from '@/features/page_management/hooks/useCardFlag';
import { usePermissions } from '@/lib/usePermissions';
import type { LoginPackage } from '@/features/page_management/types';
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
import { LoginPackageModal } from './LoginPackageModal';

export function LoginPackagesCard() {
  const toast = useToast();
  const [items, setItems] = useState<LoginPackage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<LoginPackage | 'new' | null>(null);
  const flag = useCardFlag('login_packages');
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PAGE_LOGIN_PACKAGES_READ);
  const canManage = can(PERMISSIONS.PAGE_LOGIN_PACKAGES_MANAGE);
  async function reload() {
    try {
      setItems(await listLoginPackages());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    reload();
  }, []);

  if (!canRead) return null;

  const columns: Column<LoginPackage>[] = [
    {
      key: 'name',
      header: 'الاسم',
      render: (row) => row.name,
    },
    {
      key: 'price',
      header: 'السعر',
      render: (row) => row.price,
    },
    {
      key: 'time',
      header: 'الوقت',
      render: (row) => row.time,
    },
    {
      key: 'download',
      header: 'التحميل',
      render: (row) => row.download,
    },
    {
      key: 'validity',
      header: 'الصلاحية',
      render: (row) => row.validity,
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
      render: (row: LoginPackage) => (
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
                  () => updateLoginPackage(row.id, { isActive: !row.isActive }),
                  {
                    success: row.isActive
                      ? 'تم تعطيل الباقة'
                      : 'تم تفعيل الباقة',
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
              if (!confirm('حذف الباقة؟')) return;
              try {
                await notifyMutation(
                  toast,
                  () => deleteLoginPackage(row.id),
                  { success: 'تم حذف الباقة بنجاح' },
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
    } satisfies Column<LoginPackage>,
        ]
      : []),
  ];

  return (
    <>
      {error || flag.error ? (
        <div className="error">{error || flag.error}</div>
      ) : null}
      <TaskCard
        title="الباقات"
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
            <CopyApiIcon path={PUBLIC_LOGIN_ENDPOINTS.packages} />
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
          emptyText="لا توجد باقات"
        />
      </TaskCard>
      <LoginPackageModal
        state={modal}
        onClose={() => setModal(null)}
        onSaved={reload}
      />
    </>
  );
}
