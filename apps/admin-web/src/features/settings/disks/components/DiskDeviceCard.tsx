'use client';

import { useState } from 'react';
import type {
  BlockDeviceNode,
  DiskSmartResult,
} from '@/features/settings/disks/types';
import {
  diskTypeLabel,
  formatBytes,
} from '@/features/settings/disks/types';
import { getDiskSmart } from '@/features/settings/disks/api';
import { useToast } from '@/shared/ui';
import { DiskPartitionsTable } from './DiskPartitionsTable';

type Props = {
  disk: BlockDeviceNode;
  canMount: boolean;
  canUnmount: boolean;
  onMount: (device: BlockDeviceNode) => void;
  onUnmount: (device: BlockDeviceNode) => void;
};

export function DiskDeviceCard({
  disk,
  canMount,
  canUnmount,
  onMount,
  onUnmount,
}: Props) {
  const toast = useToast();
  const [smart, setSmart] = useState<DiskSmartResult | null>(null);
  const [smartBusy, setSmartBusy] = useState(false);

  const partitions = disk.children?.length ? disk.children : [];
  const media =
    disk.rota === false ? 'SSD' : disk.rota === true ? 'HDD' : null;

  async function loadSmart() {
    setSmartBusy(true);
    try {
      setSmart(await getDiskSmart(disk.path));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر فحص SMART');
    } finally {
      setSmartBusy(false);
    }
  }

  return (
    <section className="disk-device">
      <header className="disk-device-head">
        <div className="disk-device-title">
          <h3 className="disk-device-name" dir="ltr">
            {disk.path}
          </h3>
          <p className="disk-device-meta">
            <span>{diskTypeLabel(disk.type)}</span>
            <span className="disk-dot" aria-hidden>
              ·
            </span>
            <span dir="ltr">{formatBytes(disk.sizeBytes)}</span>
            {media ? (
              <>
                <span className="disk-dot" aria-hidden>
                  ·
                </span>
                <span>{media}</span>
              </>
            ) : null}
            {disk.transport ? (
              <>
                <span className="disk-dot" aria-hidden>
                  ·
                </span>
                <span className="disk-mono" dir="ltr">
                  {disk.transport.toUpperCase()}
                </span>
              </>
            ) : null}
          </p>
          {(disk.model || disk.serial) && (
            <p className="disk-device-identity muted">
              {disk.model ? <span>{disk.model}</span> : null}
              {disk.model && disk.serial ? (
                <span className="disk-dot" aria-hidden>
                  ·
                </span>
              ) : null}
              {disk.serial ? (
                <span className="disk-mono" dir="ltr">
                  {disk.serial}
                </span>
              ) : null}
            </p>
          )}
        </div>
        <button
          type="button"
          className="btn secondary btn-sm"
          disabled={smartBusy}
          onClick={() => void loadSmart()}
        >
          {smartBusy ? 'جاري الفحص…' : 'فحص SMART'}
        </button>
      </header>

      {smart ? (
        <div className="disk-smart">
          <div className="disk-smart-row">
            <span className="disk-smart-label">الحالة</span>
            <span
              className={`status-pill status-${
                smart.passed === true
                  ? 'ok'
                  : smart.passed === false
                    ? 'error'
                    : 'missing'
              }`}
            >
              {smart.passed === true
                ? 'سليم'
                : smart.passed === false
                  ? 'فشل'
                  : 'غير متاح'}
            </span>
          </div>
          <div className="disk-smart-grid">
            <div>
              <span className="disk-smart-label">التفاصيل</span>
              <p>{smart.detail}</p>
            </div>
            {smart.temperatureC != null ? (
              <div>
                <span className="disk-smart-label">الحرارة</span>
                <p dir="ltr">{smart.temperatureC} °C</p>
              </div>
            ) : null}
            {smart.powerOnHours != null ? (
              <div>
                <span className="disk-smart-label">ساعات التشغيل</span>
                <p dir="ltr">{smart.powerOnHours.toLocaleString('en')}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <DiskPartitionsTable
        partitions={partitions}
        canMount={canMount}
        canUnmount={canUnmount}
        onMount={onMount}
        onUnmount={onUnmount}
      />
    </section>
  );
}
