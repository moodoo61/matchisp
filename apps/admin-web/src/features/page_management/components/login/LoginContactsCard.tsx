'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  PUBLIC_LOGIN_ENDPOINTS,
  deleteContactMethod,
  listContactMethods,
  updateContactMethod,
} from '@/features/page_management/api';
import { useCardFlag } from '@/features/page_management/hooks/useCardFlag';
import { usePermissions } from '@/lib/usePermissions';
import type { ContactMethod } from '@/features/page_management/types';
import { CONTACT_METHOD_TYPE_LABELS } from '@/features/page_management/types';
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
import { LoginContactsModal } from './LoginContactsModal';

function typeLabel(type: string) {
  return (
    CONTACT_METHOD_TYPE_LABELS[
      type as keyof typeof CONTACT_METHOD_TYPE_LABELS
    ] ?? type
  );
}

export function LoginContactsCard() {
  const toast = useToast();
  const [items, setItems] = useState<ContactMethod[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ContactMethod | 'new' | null>(null);
  const flag = useCardFlag('login_contacts');
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PAGE_LOGIN_CONTACTS_READ);
  const canManage = can(PERMISSIONS.PAGE_LOGIN_CONTACTS_MANAGE);

  async function reload() {
    try {
      setItems(await listContactMethods());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  if (!canRead) return null;

  const columns: Column<ContactMethod>[] = [
    {
      key: 'type',
      header: 'النوع',
      render: (row) => typeLabel(row.contactType),
    },
    {
      key: 'display',
      header: 'العنوان',
      render: (row) => row.displayName,
    },
    {
      key: 'value',
      header: 'القيمة',
      render: (row) => row.value,
    },
    {
      key: 'notes',
      header: 'ملاحظات',
      render: (row) => row.notes || '—',
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
            render: (row: ContactMethod) => (
              <div className="row-actions">
                <IconButton label="تعديل" onClick={() => setModal(row)}>
                  <IconEdit />
                </IconButton>
                <IconButton
                  label={row.isActive ? 'إيقاف' : 'تفعيل'}
                  onClick={() => {
                    void (async () => {
                      try {
                        await notifyMutation(
                          toast,
                          () =>
                            updateContactMethod(row.id, {
                              isActive: !row.isActive,
                            }),
                          {
                            success: row.isActive
                              ? 'تم إيقاف طريقة التواصل'
                              : 'تم تفعيل طريقة التواصل',
                          },
                        );
                        await reload();
                      } catch {
                        /* toast */
                      }
                    })();
                  }}
                >
                  <IconToggle />
                </IconButton>
                <IconButton
                  label="حذف"
                  tone="danger"
                  onClick={() => {
                    if (!confirm(`حذف «${row.displayName}»؟`)) return;
                    void (async () => {
                      try {
                        await notifyMutation(
                          toast,
                          () => deleteContactMethod(row.id),
                          { success: 'تم الحذف' },
                        );
                        await reload();
                      } catch {
                        /* toast */
                      }
                    })();
                  }}
                >
                  <IconTrash />
                </IconButton>
              </div>
            ),
          } satisfies Column<ContactMethod>,
        ]
      : []),
  ];

  return (
    <>
      {error || flag.error ? (
        <div className="error">{error || flag.error}</div>
      ) : null}
      <TaskCard
        title="طرق التواصل"
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
            <CopyApiIcon path={PUBLIC_LOGIN_ENDPOINTS.contacts} />
            {canManage ? (
              <IconButton label="إضافة" onClick={() => setModal('new')}>
                <IconPlus />
              </IconButton>
            ) : null}
          </>
        }
      >
        {items.length ? (
          <DataTable columns={columns} rows={items} rowKey={(r) => r.id} />
        ) : (
          <p className="muted">لا توجد طرق تواصل بعد.</p>
        )}
      </TaskCard>
      {canManage ? (
        <LoginContactsModal
          state={modal}
          onClose={() => setModal(null)}
          onSaved={reload}
        />
      ) : null}
    </>
  );
}
