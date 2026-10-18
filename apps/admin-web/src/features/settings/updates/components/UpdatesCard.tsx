'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  applyUpdates,
  checkForUpdates,
  getUpdateJob,
  getUpdateStatus,
} from '@/features/settings/updates/api';
import type {
  UpdateJobPhase,
  UpdateJobStatus,
  UpdateStatus,
} from '@/features/settings/updates/types';
import { usePermissions } from '@/lib/usePermissions';
import { TaskCard, notifyMutation, useToast } from '@/shared/ui';

const JOB_POLL_MS = 2000;

const PIPELINE_STEPS: { id: string; label: string; phases: UpdateJobPhase[] }[] =
  [
    { id: 'pull', label: 'تنزيل', phases: ['pulling', 'queued'] },
    { id: 'deps', label: 'اعتماديات', phases: ['install', 'build', 'env'] },
    { id: 'db', label: 'قواعد', phases: ['databases', 'generate'] },
    { id: 'migrate', label: 'ترحيل', phases: ['migrate'] },
    { id: 'restart', label: 'إعادة تشغيل', phases: ['restart'] },
    { id: 'done', label: 'اكتمل', phases: ['done'] },
  ];

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

function resolveStepStates(
  phase: UpdateJobPhase,
  lastActivePhase: UpdateJobPhase | null,
): Array<'pending' | 'active' | 'done' | 'failed'> {
  if (phase === 'idle') {
    return PIPELINE_STEPS.map(() => 'pending');
  }
  if (phase === 'done') {
    return PIPELINE_STEPS.map(() => 'done');
  }

  const effectivePhase =
    phase === 'failed' && lastActivePhase ? lastActivePhase : phase;
  const currentStep = PIPELINE_STEPS.findIndex((s) =>
    s.phases.includes(effectivePhase),
  );

  return PIPELINE_STEPS.map((_, stepIndex) => {
    if (phase === 'failed') {
      if (currentStep < 0) {
        return stepIndex === 0 ? 'failed' : 'pending';
      }
      if (stepIndex < currentStep) return 'done';
      if (stepIndex === currentStep) return 'failed';
      return 'pending';
    }
    if (currentStep < 0) return 'pending';
    if (stepIndex < currentStep) return 'done';
    if (stepIndex === currentStep) return 'active';
    return 'pending';
  });
}

export function UpdatesCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.SETTINGS_UPDATES_READ);
  const canApply = can(PERMISSIONS.SETTINGS_UPDATES_APPLY);
  const toast = useToast();

  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [job, setJob] = useState<UpdateJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [polling, setPolling] = useState(false);
  const lastActivePhaseRef = useRef<UpdateJobPhase | null>(null);
  const notifiedRef = useRef<'done' | 'failed' | null>(null);

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

  const refreshJob = useCallback(async () => {
    try {
      const next = await getUpdateJob();
      if (
        next.running &&
        next.phase !== 'failed' &&
        next.phase !== 'done' &&
        next.phase !== 'idle'
      ) {
        lastActivePhaseRef.current = next.phase;
      }
      setJob(next);
      return next;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
    void refreshJob().then((j) => {
      if (j?.running) setPolling(true);
    });
  }, [canRead, reload, refreshJob]);

  useEffect(() => {
    if (!polling || !canRead) return;

    let cancelled = false;
    const tick = async () => {
      const next = await refreshJob();
      if (cancelled || !next) return;

      if (next.phase === 'done' && notifiedRef.current !== 'done') {
        notifiedRef.current = 'done';
        toast.success(next.message || 'اكتمل التحديث بنجاح');
        setPolling(false);
        await reload();
        return;
      }
      if (next.phase === 'failed' && notifiedRef.current !== 'failed') {
        notifiedRef.current = 'failed';
        toast.error(next.error || next.message || 'فشل التحديث');
        setPolling(false);
        return;
      }
      if (!next.running && next.phase !== 'done' && next.phase !== 'failed') {
        setPolling(false);
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), JOB_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [polling, canRead, refreshJob, reload, toast]);

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
        `تنزيل وتطبيق ${status.behindBy} تحديثاً من المستودع؟\nسيُثبَّت الاعتماديات وتُنشأ/تُرحَّل القواعد ثم تُعاد تشغيل الخدمات تلقائياً.`,
      )
    ) {
      return;
    }
    setBusy(true);
    notifiedRef.current = null;
    lastActivePhaseRef.current = 'pulling';
    try {
      const result = await notifyMutation(toast, () => applyUpdates(), {
        success: 'تم تنزيل التحديثات',
        error: 'تعذر تنزيل التحديثات',
      });
      toast.info(result.message);
      setPolling(true);
      await refreshJob();
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

  const jobRunning = Boolean(job?.running) || polling;
  const canDownload =
    canApply &&
    !!status?.updateAvailable &&
    !status.dirty &&
    status.aheadBy === 0 &&
    status.lastFetchOk &&
    !jobRunning;

  const stepStates =
    job && job.phase !== 'idle'
      ? resolveStepStates(job.phase, lastActivePhaseRef.current)
      : null;

  return (
    <TaskCard
      title="التحديث"
      actions={
        <div className="updates-card-actions">
          <button
            type="button"
            className="btn secondary"
            disabled={busy || checking || jobRunning}
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
              {jobRunning ? 'جارٍ التطبيق…' : 'تنزيل التحديثات'}
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

          {job && stepStates && job.phase !== 'idle' ? (
            <div
              className={[
                'updates-pipeline',
                job.phase === 'failed' ? 'is-failed' : '',
                job.phase === 'done' ? 'is-done' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <p className="updates-pipeline-msg">{job.message}</p>
              <ol className="updates-steps">
                {PIPELINE_STEPS.map((step, idx) => (
                  <li
                    key={step.id}
                    className={`updates-step is-${stepStates[idx]}`}
                  >
                    <span className="updates-step-dot" aria-hidden />
                    <span className="updates-step-label">{step.label}</span>
                  </li>
                ))}
              </ol>
              {job.phase === 'failed' && job.error ? (
                <p className="error-text updates-job-error">{job.error}</p>
              ) : null}
              {job.phase === 'failed' && job.logTail ? (
                <pre className="updates-log-tail" dir="ltr">
                  {job.logTail.trim().slice(-2000)}
                </pre>
              ) : null}
            </div>
          ) : null}

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
