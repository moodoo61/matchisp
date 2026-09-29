'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  getMonitoredServiceStatus,
  listMonitoredServices,
  updateMonitoredService,
} from '@/features/service_monitor/api';
import type {
  MonitoredService,
  MonitoredServiceKey,
  ServiceProbeResult,
  ServiceProbeStatus,
} from '@/features/service_monitor/types';
import { SERVICE_META } from '@/features/service_monitor/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  CardEnableToggle,
  IconButton,
  TaskCard,
  notifyMutation,
  useToast,
} from '@/shared/ui';

const STATUS_LABEL: Record<ServiceProbeStatus, string> = {
  ok: 'متصل',
  degraded: 'محدود',
  missing: 'غير مضبوط',
  error: 'خطأ',
};

function StatusPill({ status }: { status: ServiceProbeStatus }) {
  return (
    <span className={`status-pill status-${status}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

type Row = {
  service: MonitoredService;
  probe: ServiceProbeResult | null;
};

/** بطاقات حالة الخدمات الثلاث في صفحة واحدة */
export function ServiceMonitorOverview() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.SERVICE_MONITOR_READ);
  const canUpdate = can(PERMISSIONS.SERVICE_MONITOR_UPDATE);
  const toast = useToast();

  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);

  const reload = useCallback(async () => {
    setBusyAll(true);
    try {
      const services = await listMonitoredServices();
      const probes = await Promise.all(
        services.map((s) =>
          getMonitoredServiceStatus(s.key as MonitoredServiceKey).catch(
            () => null,
          ),
        ),
      );
      setRows(
        services.map((service, i) => ({
          service,
          probe: probes[i],
        })),
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب الخدمات');
    } finally {
      setBusyAll(false);
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
  }, [canRead, reload]);

  async function refreshOne(key: MonitoredServiceKey) {
    setBusyKey(key);
    try {
      const probe = await getMonitoredServiceStatus(key);
      setRows((prev) =>
        prev.map((row) =>
          row.service.key === key ? { ...row, probe } : row,
        ),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر فحص الحالة');
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleEnabled(service: MonitoredService) {
    if (!canUpdate) return;
    const key = service.key as MonitoredServiceKey;
    setBusyKey(key);
    try {
      const nextEnabled = !service.isEnabled;
      const next = await notifyMutation(
        toast,
        () => updateMonitoredService(key, { isEnabled: nextEnabled }),
        {
          success: nextEnabled ? 'تم تفعيل المتابعة' : 'تم إيقاف المتابعة',
        },
      );
      const probe = await getMonitoredServiceStatus(key);
      setRows((prev) =>
        prev.map((row) =>
          row.service.key === key
            ? { service: next, probe }
            : row,
        ),
      );
    } catch {
      /* toast */
    } finally {
      setBusyKey(null);
    }
  }

  if (!canRead) return null;

  return (
    <TaskCard
      title="حالة الخدمات"
      actions={
        <IconButton
          label="تحديث الكل"
          onClick={() => void reload()}
          disabled={busyAll}
        >
          ↻
        </IconButton>
      }
    >
      {error ? <p className="error">{error}</p> : null}
      {!rows.length && !error ? (
        <p className="muted">جاري الفحص…</p>
      ) : null}

      <div className="runtime-status-grid">
        {rows.map(({ service, probe }) => {
          const key = service.key as MonitoredServiceKey;
          const meta = SERVICE_META[key];
          const busy = busyKey === key || busyAll;

          return (
            <article key={service.id} className="runtime-status-item">
              <header>
                <strong>{meta?.title ?? service.label}</strong>
                {probe ? <StatusPill status={probe.status} /> : null}
              </header>
              <p>{meta?.subtitle ?? service.description}</p>
              {probe ? (
                <>
                  <small>{probe.detail}</small>
                  {probe.url ? (
                    <small className="runtime-meta" dir="ltr">
                      {probe.url}
                    </small>
                  ) : null}
                  {probe.latencyMs != null ? (
                    <small className="runtime-meta">
                      {probe.latencyMs} ms
                    </small>
                  ) : null}
                </>
              ) : (
                <small className="muted">لا توجد نتيجة فحص</small>
              )}
              <div className="row-actions" style={{ marginTop: 8 }}>
                {canUpdate ? (
                  <CardEnableToggle
                    enabled={service.isEnabled}
                    busy={busy}
                    onToggle={() => void toggleEnabled(service)}
                  />
                ) : null}
                <IconButton
                  label="فحص"
                  onClick={() => void refreshOne(key)}
                  disabled={busy}
                >
                  ↻
                </IconButton>
              </div>
            </article>
          );
        })}
      </div>
    </TaskCard>
  );
}
