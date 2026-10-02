'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  PUBLIC_LOGIN_ENDPOINTS,
  deleteTextAd,
  listTextAds,
  updateTextAd,
} from '@/features/page_management/api';
import { useCardFlag } from '@/features/page_management/hooks/useCardFlag';
import { usePermissions } from '@/lib/usePermissions';
import type { TextAd } from '@/features/page_management/types';
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
  TickerPreview,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';
import { LoginTextAdModal } from './LoginTextAdModal';

export function LoginTextAdsCard() {
  const toast = useToast();
  const [items, setItems] = useState<TextAd[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<TextAd | 'new' | null>(null);
  const flag = useCardFlag('login_ticker');
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PAGE_LOGIN_TICKER_READ);
  const canCreate = can(PERMISSIONS.PAGE_LOGIN_TICKER_CREATE);
  const canUpdate = can(PERMISSIONS.PAGE_LOGIN_TICKER_UPDATE);
  const canDelete = can(PERMISSIONS.PAGE_LOGIN_TICKER_DELETE);
  const canToggle = can(PERMISSIONS.PAGE_LOGIN_TICKER_TOGGLE);
  async function reload() {
    try {
      setItems(await listTextAds());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    reload();
  }, []);

  if (!canRead) return null;

  const activeTexts = items
    .filter((t) => t.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((t) => t.text);

  const columns: Column<TextAd>[] = [
    {
      key: 'text',
      header: 'النص',
      render: (row) => row.text,
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
      render: (row: TextAd) => (
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
                    () => updateTextAd(row.id, { isActive: !row.isActive }),
                    {
                      success: row.isActive
                        ? 'تم تعطيل النص'
                        : 'تم تفعيل النص',
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
                if (!confirm('حذف النص؟')) return;
                try {
                  await notifyMutation(
                    toast,
                    () => deleteTextAd(row.id),
                    { success: 'تم حذف النص بنجاح' },
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
    } satisfies Column<TextAd>,
        ]
      : []),
  ];

  return (
    <>
      {error || flag.error ? (
        <div className="error">{error || flag.error}</div>
      ) : null}
      <TaskCard
        title="إعلان النص"
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
            <CopyApiIcon path={PUBLIC_LOGIN_ENDPOINTS.ticker} />
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
        {activeTexts.length ? <TickerPreview items={activeTexts} /> : null}
        <DataTable columns={columns} rows={items} rowKey={(r) => r.id} />
      </TaskCard>
      {canCreate || canUpdate ? (
        <LoginTextAdModal
          state={modal}
          onClose={() => setModal(null)}
          onSaved={reload}
        />
      ) : null}
    </>
  );
}
