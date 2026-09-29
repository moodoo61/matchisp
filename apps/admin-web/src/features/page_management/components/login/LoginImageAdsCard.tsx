'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  PUBLIC_LOGIN_ENDPOINTS,
  deleteImageAd,
  listImageAds,
  updateImageAd,
} from '@/features/page_management/api';
import { useCardFlag } from '@/features/page_management/hooks/useCardFlag';
import { usePermissions } from '@/lib/usePermissions';
import type { ImageAd } from '@/features/page_management/types';
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
import { LoginImageAdModal } from './LoginImageAdModal';

export function LoginImageAdsCard() {
  const toast = useToast();
  const [items, setItems] = useState<ImageAd[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ImageAd | 'new' | null>(null);
  const flag = useCardFlag('login_images');
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PAGE_LOGIN_IMAGES_READ);
  const canManage = can(PERMISSIONS.PAGE_LOGIN_IMAGES_MANAGE);
  async function reload() {
    try {
      setItems(await listImageAds());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    reload();
  }, []);

  if (!canRead) return null;

  const columns: Column<ImageAd>[] = [
    {
      key: 'preview',
      header: 'معاينة',
      render: (row) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.imageUrl} alt="" className="table-thumb" />
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
      render: (row: ImageAd) => (
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
                  () => updateImageAd(row.id, { isActive: !row.isActive }),
                  {
                    success: row.isActive
                      ? 'تم تعطيل الإعلان'
                      : 'تم تفعيل الإعلان',
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
              if (!confirm('حذف الإعلان؟')) return;
              try {
                await notifyMutation(
                  toast,
                  () => deleteImageAd(row.id),
                  { success: 'تم حذف الإعلان بنجاح' },
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
    } satisfies Column<ImageAd>,
        ]
      : []),
  ];

  return (
    <>
      {error || flag.error ? (
        <div className="error">{error || flag.error}</div>
      ) : null}
      <TaskCard
        title="إعلانات الصور"
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
            <CopyApiIcon path={PUBLIC_LOGIN_ENDPOINTS.ads} />
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
        <DataTable columns={columns} rows={items} rowKey={(r) => r.id} />
      </TaskCard>
      <LoginImageAdModal
        state={modal}
        onClose={() => setModal(null)}
        onSaved={reload}
      />
    </>
  );
}
