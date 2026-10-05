'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  applyUpdates,
  checkForUpdates,
  getUpdateStatus,
} from '@/features/settings/updates/api';
import type { UpdateStatus } from '@/features/settings/updates/types';
import { usePermissions } from '@/lib/usePermissions';
import { TaskCard, notifyMutation, useToast } from '@/shared/ui';

function formatCheckedAt(value: string) {
  try {
    return new Intl.DateTimeFormat('ar', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatCommitDate(value: string) {
  try {
    return new Intl.DateTimeFormat('ar', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function UpdatesCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.SETTINGS_UPDATES_READ);
  const canApply = can(PERMISSIONS.SETTINGS_UPDATES_APPLY);
  const toast = useToast();

  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      const next = await getUpdateStatus();
      setStatus(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب حالة التحديث');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
  }, [canRead, reload]);

  async function onCheck() {
    if (!canRead) return;
    setChecking(true);
    try {
      const next = await notifyMutation(toast, () => checkForUpdates(), {
        success: 'تم فحص المستودع',
        error: 'تعذر فحص التحديثات',
      });
      setStatus(next);
      setError(null);
    } catch {
      /* toast */
    } finally {
      setChecking(false);
    }
  }

  async function onApply() {
    if (!canApply || !status) return;
    if (
      !confirm(
        `تنزيل وتطبيق ${status.behindBy} تحديثاً من المستودع؟\nقد تُعاد تشغيل الخدمات تلقائياً بعد التنزيل.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const result = await notifyMutation(toast, () => applyUpdates(), {
        success: 'تم تنزيل التحديثات',
        error: 'تعذر تنزيل التحديثات',
      });
      toast.info(result.message);
      await reload();
    } catch {
      /* toast */
    } finally {
      setBusy(false);
    }
  }

  if (!canRead) {
    return (
      <TaskCard title="التحديث">
        <p className="muted">ليست لديك صلاحية عرض التحديثات</p>
      </TaskCard>
    );
  }

  const canDownload =
    canApply &&
    !!status?.updateAvailable &&
    !status.dirty &&
    status.aheadBy === 0 &&
    status.lastFetchOk;

  return (
    <TaskCard
      title="التحديث"
      actions={
        <div className="updates-card-actions">
          <button
            type="button"
            className="btn secondary"
            disabled={busy || checking}
            onClick={() => void onCheck()}
          >
            {checking ? 'جارٍ الفحص…' : 'فحص التحديثات'}
          </button>
          {canApply ? (
            <button
              type="button"
              className="btn"
              disabled={busy || checking || !canDownload}
              onClick={() => void onApply()}
            >
              تنزيل التحديثات
            </button>
          ) : null}
        </div>
      }
    >
      {error ? <p className="error-text">{error}</p> : null}

      {!status && busy ? <p className="muted">جارٍ التحميل…</p> : null}

      {status ? (
        <div className="updates-panel">
          <p
            className={[
              'updates-banner',
              status.updateAvailable ? 'is-available' : '',
              status.dirty ? 'is-dirty' : '',
              !status.updateAvailable && !status.dirty ? 'is-ok' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {status.message}
          </p>

          <dl className="updates-meta">
            <div>
              <dt>الإصدار الحالي</dt>
              <dd>
                <code>{status.currentVersion}</code>
              </dd>
            </div>
            <div>
              <dt>الالتزام</dt>
              <dd>
                <code>{status.currentShortHash}</code>
              </dd>
            </div>
            <div>
              <dt>الفرع</dt>
              <dd>
                <code>{status.branch}</code>
                {status.upstream ? (
                  <span className="muted"> ← {status.upstream}</span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt>المستودع</dt>
              <dd className="updates-remote">{status.remoteUrl}</dd>
            </div>
            <div>
              <dt>آخر فحص</dt>
              <dd>{formatCheckedAt(status.checkedAt)}</dd>
            </div>
            <div>
              <dt>الحالة</dt>
              <dd>
                {status.updateAvailable
                  ? `${status.behindBy} تحديث متاح`
                  : 'محدّث'}
                {status.dirty ? ' · تعديلات محلية' : ''}
              </dd>
            </div>
          </dl>

          {status.dirty && status.dirtySummary.length ? (
            <div className="updates-dirty">
              <h3>ملفات معدّلة محلياً</h3>
              <ul>
                {status.dirtySummary.map((line) => (
                  <li key={line}>
                    <code>{line}</code>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {status.commits.length ? (
            <div className="updates-commits">
              <h3>التحديثات المتاحة</h3>
              <ul>
                {status.commits.map((commit) => (
                  <li key={commit.hash}>
                    <div className="updates-commit-head">
                      <code>{commit.shortHash}</code>
                      <span className="muted">
                        {formatCommitDate(commit.date)}
                      </span>
                    </div>
                    <p>{commit.subject}</p>
                    <span className="muted updates-commit-author">
                      {commit.author}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </TaskCard>
  );
}
