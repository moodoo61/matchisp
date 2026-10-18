'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  createMorePageAbout,
  deleteMorePageAbout,
  listMorePageAbout,
  updateMorePageAbout,
} from '@/features/page_management/api';
import { useCardFlag } from '@/features/page_management/hooks/useCardFlag';
import type {
  MorePageAboutCard,
  MorePageAboutIconKey,
} from '@/features/page_management/types';
import { MORE_PAGE_ABOUT_ICON_LABELS } from '@/features/page_management/types';
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
import { MorePageAboutModal } from './MorePageAboutModal';

/** بطاقة إدارة «من نحن» في صفحة المزيد */
export function MorePageAboutCardsCard() {
  const toast = useToast();
  const [items, setItems] = useState<MorePageAboutCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<MorePageAboutCard | 'new' | null>(null);
  const flag = useCardFlag('more_page_about');
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PAGE_MORE_ABOUT_READ);
  const canCreate = can(PERMISSIONS.PAGE_MORE_ABOUT_CREATE);
  const canUpdate = can(PERMISSIONS.PAGE_MORE_ABOUT_UPDATE);
  const canDelete = can(PERMISSIONS.PAGE_MORE_ABOUT_DELETE);
  const canToggle = can(PERMISSIONS.PAGE_MORE_ABOUT_TOGGLE);

  async function reload() {
    try {
      setItems(await listMorePageAbout());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    reload();
  }, []);

  if (!canRead) return null;

  const columns: Column<MorePageAboutCard>[] = [
    {
      key: 'title',
      header: 'العنوان',
      render: (row) => row.title,
    },
    {
      key: 'icon',
      header: 'الأيقونة',
      render: (row) =>
        MORE_PAGE_ABOUT_ICON_LABELS[row.iconKey as MorePageAboutIconKey] ??
        row.iconKey,
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
            render: (row: MorePageAboutCard) => (
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
                            updateMorePageAbout(row.id, {
                              isActive: !row.isActive,
                            }),
                          {
                            success: row.isActive
                              ? 'تم تعطيل البطاقة'
                              : 'تم تفعيل البطاقة',
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
                      if (!confirm('حذف البطاقة؟')) return;
                      try {
                        await notifyMutation(
                          toast,
                          () => deleteMorePageAbout(row.id),
                          { success: 'تم حذف البطاقة بنجاح' },
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
          } satisfies Column<MorePageAboutCard>,
        ]
      : []),
  ];

  return (
    <>
      {error || flag.error ? (
        <div className="error">{error || flag.error}</div>
      ) : null}
      <TaskCard
        title="من نحن"
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
          emptyText="لا توجد بطاقات"
        />
      </TaskCard>

      {canCreate || canUpdate ? (
        <MorePageAboutModal
          state={modal}
          onClose={() => setModal(null)}
          onSave={async (input) => {
            if (modal === 'new') await createMorePageAbout(input);
            else if (modal) await updateMorePageAbout(modal.id, input);
            setModal(null);
            await reload();
          }}
        />
      ) : null}
    </>
  );
}
