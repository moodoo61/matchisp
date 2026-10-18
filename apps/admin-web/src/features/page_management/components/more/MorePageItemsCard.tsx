'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  createMorePageItem,
  deleteMorePageItem,
  listMorePageItems,
  updateMorePageItem,
} from '@/features/page_management/api';
import { useCardFlag } from '@/features/page_management/hooks/useCardFlag';
import type { MorePageItem } from '@/features/page_management/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  CardEnableToggle,
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
import { MorePageItemModal } from './MorePageItemModal';

/** بطاقة إدارة عناصر تبويب المحتوى في صفحة المزيد */
export function MorePageItemsCard() {
  const toast = useToast();
  const [items, setItems] = useState<MorePageItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<MorePageItem | 'new' | null>(null);
  const flag = useCardFlag('more_page_items');
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PAGE_MORE_ITEMS_READ);
  const canCreate = can(PERMISSIONS.PAGE_MORE_ITEMS_CREATE);
  const canUpdate = can(PERMISSIONS.PAGE_MORE_ITEMS_UPDATE);
  const canDelete = can(PERMISSIONS.PAGE_MORE_ITEMS_DELETE);
  const canToggle = can(PERMISSIONS.PAGE_MORE_ITEMS_TOGGLE);

  async function reload() {
    try {
      setItems(await listMorePageItems());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    reload();
  }, []);

  if (!canRead) return null;

  const columns: Column<MorePageItem>[] = [
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
      key: 'instructions',
      header: 'تعليمات',
      render: (row) =>
        row.instructions?.length ? `${row.instructions.length} خطوة` : '—',
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
            render: (row: MorePageItem) => (
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
                            updateMorePageItem(row.id, {
                              isActive: !row.isActive,
                            }),
                          {
                            success: row.isActive
                              ? 'تم تعطيل العنصر'
                              : 'تم تفعيل العنصر',
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
                      if (!confirm('حذف العنصر؟')) return;
                      try {
                        await notifyMutation(
                          toast,
                          () => deleteMorePageItem(row.id),
                          { success: 'تم حذف العنصر بنجاح' },
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
          } satisfies Column<MorePageItem>,
        ]
      : []),
  ];

  return (
    <>
      {error || flag.error ? (
        <div className="error">{error || flag.error}</div>
      ) : null}
      <TaskCard
        title="العناصر"
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
          emptyText="لا توجد عناصر"
        />
      </TaskCard>

      {canCreate || canUpdate ? (
        <MorePageItemModal
          state={modal}
          onClose={() => setModal(null)}
          onSave={async (input) => {
            if (modal === 'new') await createMorePageItem(input);
            else if (modal) await updateMorePageItem(modal.id, input);
            setModal(null);
            await reload();
          }}
        />
      ) : null}
    </>
  );
}
