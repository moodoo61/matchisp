'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  createDatabaseBackup,
  deleteDatabaseBackup,
  downloadDatabaseBackup,
  listDatabaseBackups,
  listSectionDatabases,
  restoreDatabaseBackup,
  uploadDatabaseRestore,
} from '@/features/settings/databases/api';
import type {
  BackupFileInfo,
  DatabasesInventory,
  SectionDatabaseStatus,
} from '@/features/settings/databases/types';
import { formatBytes } from '@/features/settings/databases/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  DataTable,
  IconButton,
  TaskCard,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';

export function DatabasesCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.SETTINGS_DATABASES_READ);
  const canBackup = can(PERMISSIONS.SETTINGS_DATABASES_BACKUP);
  const canRestore = can(PERMISSIONS.SETTINGS_DATABASES_RESTORE);
  const canManage = can(PERMISSIONS.SETTINGS_DATABASES_MANAGE);
  const toast = useToast();

  const [inventory, setInventory] = useState<DatabasesInventory | null>(null);
  const [backups, setBackups] = useState<BackupFileInfo[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const openDb = useMemo(
    () => inventory?.databases.find((d) => d.key === openKey) ?? null,
    [inventory, openKey],
  );

  const openBackups = useMemo(
    () => (openKey ? backups.filter((b) => b.sectionKey === openKey) : []),
    [backups, openKey],
  );

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      const [inv, files] = await Promise.all([
        listSectionDatabases(),
        listDatabaseBackups(),
      ]);
      setInventory(inv);
      setBackups(files);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب قواعد البيانات');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
  }, [canRead, reload]);

  async function handleBackup(db: SectionDatabaseStatus) {
    if (!canBackup) return;
    setBusy(true);
    try {
      await notifyMutation(toast, () => createDatabaseBackup(db.key), {
        success: `تم إنشاء نسخة لـ ${db.label}`,
      });
      setOpenKey(db.key);
      await reload();
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore(file: BackupFileInfo, db: SectionDatabaseStatus) {
    if (!canRestore) return;
    if (
      !confirm(
        `استعادة «${db.label}» (${db.dbName}) من:\n${file.filename}\n\nتُستبدل بيانات هذا القسم فقط.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await notifyMutation(
        toast,
        () => restoreDatabaseBackup(file.sectionKey, file.filename),
        { success: `تمت استعادة ${db.label}` },
      );
      await reload();
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(file: BackupFileInfo) {
    if (!canManage) return;
    if (!confirm(`حذف النسخة ${file.filename}؟`)) return;
    setBusy(true);
    try {
      await notifyMutation(
        toast,
        () => deleteDatabaseBackup(file.sectionKey, file.filename),
        { success: 'تم حذف النسخة' },
      );
      await reload();
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(file: BackupFileInfo) {
    try {
      await downloadDatabaseBackup(file.sectionKey, file.filename);
      toast.success('بدأ التنزيل');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر التنزيل');
    }
  }

  async function handleUpload(
    db: SectionDatabaseStatus,
    fileList: FileList | null,
  ) {
    if (!canRestore || !fileList?.length) return;
    const file = fileList[0];
    if (
      !confirm(
        `رفع واستعادة «${db.label}» من:\n${file.name}\n\nتُستبدل بيانات هذا القسم فقط.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await notifyMutation(
        toast,
        () => uploadDatabaseRestore(db.key, file),
        { success: `تمت الاستعادة إلى ${db.label}` },
      );
      setOpenKey(db.key);
      await reload();
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  if (!canRead) return null;

  const columns: Column<SectionDatabaseStatus>[] = [
    {
      key: 'label',
      header: 'القسم',
      render: (row) => (
        <div className="db-cell-stack">
          <strong>{row.label}</strong>
          <span className="muted db-desc">{row.description}</span>
        </div>
      ),
    },
    {
      key: 'dbName',
      header: 'القاعدة',
      render: (row) => (
        <span className="mono" dir="ltr">
          {row.dbName}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'الحجم',
      className: 'db-num',
      render: (row) =>
        row.sizeBytes != null ? formatBytes(row.sizeBytes) : '—',
    },
    {
      key: 'backups',
      header: 'النسخ',
      className: 'db-num',
      render: (row) => row.backupCount,
    },
    {
      key: 'last',
      header: 'آخر نسخة',
      render: (row) =>
        row.lastBackupAt
          ? new Date(row.lastBackupAt).toLocaleString('ar')
          : '—',
    },
    {
      key: 'actions',
      header: '',
      className: 'col-actions',
      render: (row) => (
        <div className="row-actions">
          {canBackup ? (
            <button
              type="button"
              className="btn secondary btn-sm"
              disabled={busy || !row.configured}
              onClick={() => void handleBackup(row)}
            >
              نسخ
            </button>
          ) : null}
          <button
            type="button"
            className="btn secondary btn-sm"
            disabled={busy}
            onClick={() =>
              setOpenKey((prev) => (prev === row.key ? null : row.key))
            }
          >
            {openKey === row.key ? 'إخفاء النسخ' : 'عرض النسخ'}
          </button>
          {canRestore ? (
            <label className="btn secondary btn-sm db-upload-btn">
              رفع واستعادة
              <input
                type="file"
                accept=".dump"
                hidden
                disabled={busy || !row.configured}
                onChange={(e) => {
                  void handleUpload(row, e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          ) : null}
        </div>
      ),
    },
  ];

  const backupColumns: Column<BackupFileInfo>[] = [
    {
      key: 'file',
      header: 'الملف',
      render: (row) => (
        <span className="mono" dir="ltr">
          {row.filename}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'الحجم',
      className: 'db-num',
      render: (row) => formatBytes(row.sizeBytes),
    },
    {
      key: 'date',
      header: 'التاريخ',
      render: (row) => new Date(row.createdAt).toLocaleString('ar'),
    },
    {
      key: 'actions',
      header: '',
      className: 'col-actions',
      render: (row) => (
        <div className="row-actions">
          <button
            type="button"
            className="btn secondary btn-sm"
            disabled={busy}
            onClick={() => void handleDownload(row)}
          >
            تنزيل
          </button>
          {canRestore && openDb ? (
            <button
              type="button"
              className="btn secondary btn-sm"
              disabled={busy}
              onClick={() => void handleRestore(row, openDb)}
            >
              استعادة
            </button>
          ) : null}
          {canManage ? (
            <button
              type="button"
              className="btn danger btn-sm"
              disabled={busy}
              onClick={() => void handleDelete(row)}
            >
              حذف
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <TaskCard
        title="قواعد البيانات"
        actions={
          <IconButton
            label="تحديث"
            onClick={() => void reload()}
            disabled={busy}
          >
            ↻
          </IconButton>
        }
      >
        {error ? <p className="error">{error}</p> : null}
        {!inventory && !error ? (
          <p className="muted">جاري التحميل…</p>
        ) : null}
        {inventory ? (
          <DataTable
            columns={columns}
            rows={inventory.databases}
            rowKey={(r) => r.key}
            emptyText="لا توجد قواعد"
          />
        ) : null}
      </TaskCard>

      {openDb ? (
        <TaskCard title={`نسخ ${openDb.label}`}>
          <p className="muted db-backup-hint">
            <span className="mono" dir="ltr">
              {openDb.dbName}
            </span>
          </p>
          <DataTable
            columns={backupColumns}
            rows={openBackups}
            rowKey={(r) => r.filename}
            emptyText="لا توجد نسخ لهذا القسم بعد"
          />
        </TaskCard>
      ) : null}
    </>
  );
}
