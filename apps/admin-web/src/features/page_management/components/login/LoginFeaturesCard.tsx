'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  PUBLIC_LOGIN_ENDPOINTS,
  deleteLoginFeature,
  listLoginFeatures,
  updateLoginFeature,
} from '@/features/page_management/api';
import { useCardFlag } from '@/features/page_management/hooks/useCardFlag';
import { usePermissions } from '@/lib/usePermissions';
import type { LoginFeature } from '@/features/page_management/types';
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
import { LoginFeatureModal } from './LoginFeatureModal';

export function LoginFeaturesCard() {
  const toast = useToast();
  const [items, setItems] = useState<LoginFeature[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<LoginFeature | 'new' | null>(null);
  const flag = useCardFlag('login_features');
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PAGE_LOGIN_FEATURES_READ);
  const canCreate = can(PERMISSIONS.PAGE_LOGIN_FEATURES_CREATE);
  const canUpdate = can(PERMISSIONS.PAGE_LOGIN_FEATURES_UPDATE);
  const canDelete = can(PERMISSIONS.PAGE_LOGIN_FEATURES_DELETE);
  const canToggle = can(PERMISSIONS.PAGE_LOGIN_FEATURES_TOGGLE);

  async function reload() {
    try {
      setItems(await listLoginFeatures());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    reload();
  }, []);

  if (!canRead) return null;

  const columns: Column<LoginFeature>[] = [
    {
      key: 'preview',
      header: 'الخلفية',
      render: (row) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.imageUrl} alt="" className="table-thumb" />
      ),
    },
    {
      key: 'title',
      header: 'الميزة',
      render: (row) => (
        <span>
          {row.icon ? `${row.icon} ` : ''}
          {row.title}
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
            render: (row: LoginFeature) => (
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
                            updateLoginFeature(row.id, {
                              isActive: !row.isActive,
                            }),
                          {
                            success: row.isActive
                              ? 'تم تعطيل الميزة'
                              : 'تم تفعيل الميزة',
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
                ) : null}
                {canDelete ? (
                  <IconButton
                    label="حذف"
                    tone="danger"
                    onClick={async () => {
                      if (!confirm('حذف الميزة؟')) return;
                      try {
                        await notifyMutation(
                          toast,
                          () => deleteLoginFeature(row.id),
                          { success: 'تم حذف الميزة' },
                        );
                        await reload();
                      } catch {
                        // notifyMutation
                      }
                    }}
                  >
                    <IconTrash />
                  </IconButton>
                ) : null}
              </div>
            ),
          } satisfies Column<LoginFeature>,
        ]
      : []),
  ];

  return (
    <>
      {error || flag.error ? (
        <div className="error">{error || flag.error}</div>
      ) : null}
      <TaskCard
        title="المميزات"
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
            <CopyApiIcon path={PUBLIC_LOGIN_ENDPOINTS.features} />
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
        <p className="muted" style={{ marginBottom: 12 }}>
          تظهر في الجهة اليسرى من صفحة الدخول، وصورة كل ميزة تُستخدم كخلفية عند
          تمرير المؤشر عليها.
        </p>
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          emptyText="لا توجد مميزات"
        />
      </TaskCard>
      {canCreate || canUpdate ? (
        <LoginFeatureModal
          state={modal}
          onClose={() => setModal(null)}
          onSaved={reload}
        />
      ) : null}
    </>
  );
}
