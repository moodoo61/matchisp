'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  createMorePageStory,
  deleteMorePageStory,
  listMorePageStory,
  updateMorePageStory,
} from '@/features/page_management/api';
import { useCardFlag } from '@/features/page_management/hooks/useCardFlag';
import type {
  MorePageStoryBlock,
  MorePageStoryVariant,
} from '@/features/page_management/types';
import { MORE_PAGE_STORY_VARIANT_LABELS } from '@/features/page_management/types';
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
import { MorePageStoryModal } from './MorePageStoryModal';

/** بطاقة إدارة مقاطع القصة في صفحة المزيد */
export function MorePageStoryCard() {
  const toast = useToast();
  const [items, setItems] = useState<MorePageStoryBlock[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<MorePageStoryBlock | 'new' | null>(null);
  const flag = useCardFlag('more_page_story');
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PAGE_MORE_STORY_READ);
  const canCreate = can(PERMISSIONS.PAGE_MORE_STORY_CREATE);
  const canUpdate = can(PERMISSIONS.PAGE_MORE_STORY_UPDATE);
  const canDelete = can(PERMISSIONS.PAGE_MORE_STORY_DELETE);
  const canToggle = can(PERMISSIONS.PAGE_MORE_STORY_TOGGLE);

  async function reload() {
    try {
      setItems(await listMorePageStory());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    reload();
  }, []);

  if (!canRead) return null;

  const columns: Column<MorePageStoryBlock>[] = [
    {
      key: 'preview',
      header: 'الصورة',
      render: (row) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.imageUrl} alt="" className="table-thumb" />
      ),
    },
    {
      key: 'title',
      header: 'العنوان',
      render: (row) => row.title || '—',
    },
    {
      key: 'variant',
      header: 'النوع',
      render: (row) =>
        MORE_PAGE_STORY_VARIANT_LABELS[
          row.variant as MorePageStoryVariant
        ] ?? row.variant,
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
            render: (row: MorePageStoryBlock) => (
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
                            updateMorePageStory(row.id, {
                              isActive: !row.isActive,
                            }),
                          {
                            success: row.isActive
                              ? 'تم تعطيل المقطع'
                              : 'تم تفعيل المقطع',
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
                      if (!confirm('حذف المقطع؟')) return;
                      try {
                        await notifyMutation(
                          toast,
                          () => deleteMorePageStory(row.id),
                          { success: 'تم حذف المقطع بنجاح' },
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
          } satisfies Column<MorePageStoryBlock>,
        ]
      : []),
  ];

  return (
    <>
      {error || flag.error ? (
        <div className="error">{error || flag.error}</div>
      ) : null}
      <TaskCard
        title="القصة"
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
          emptyText="لا توجد مقاطع"
        />
      </TaskCard>

      {canCreate || canUpdate ? (
        <MorePageStoryModal
          state={modal}
          onClose={() => setModal(null)}
          onSave={async (input) => {
            if (modal === 'new') await createMorePageStory(input);
            else if (modal) await updateMorePageStory(modal.id, input);
            setModal(null);
            await reload();
          }}
        />
      ) : null}
    </>
  );
}
