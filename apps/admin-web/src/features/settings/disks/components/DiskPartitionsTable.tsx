'use client';

import type { BlockDeviceNode } from '@/features/settings/disks/types';
import {
  diskTypeLabel,
  formatBytes,
} from '@/features/settings/disks/types';
import {
  DataTable,
  type Column,
} from '@/shared/ui';

type Props = {
  partitions: BlockDeviceNode[];
  canMount: boolean;
  canUnmount: boolean;
  onMount: (device: BlockDeviceNode) => void;
  onUnmount: (device: BlockDeviceNode) => void;
};

function UsageCell({ row }: { row: BlockDeviceNode }) {
  if (!row.usage) {
    return <span className="disk-empty">—</span>;
  }
  const { capacityPercent, usedBytes, sizeBytes } = row.usage;
  const tone =
    capacityPercent >= 90 ? 'danger' : capacityPercent >= 75 ? 'warn' : 'ok';

  return (
    <div className="disk-usage">
      <div className="disk-usage-meta" dir="ltr">
        <span>
          {formatBytes(usedBytes)} / {formatBytes(sizeBytes)}
        </span>
        <span className="disk-usage-pct">{capacityPercent}%</span>
      </div>
      <div className="disk-usage-track" aria-hidden>
        <div
          className={`disk-usage-fill tone-${tone}`}
          style={{ width: `${Math.min(100, Math.max(0, capacityPercent))}%` }}
        />
      </div>
    </div>
  );
}

export function DiskPartitionsTable({
  partitions,
  canMount,
  canUnmount,
  onMount,
  onUnmount,
}: Props) {
  const columns: Column<BlockDeviceNode>[] = [
    {
      key: 'path',
      header: 'القسم',
      render: (row) => (
        <div className="disk-cell-stack">
          <span className="disk-mono" dir="ltr">
            {row.path}
          </span>
          {row.label ? (
            <span className="disk-sub muted">{row.label}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'النوع',
      render: (row) => diskTypeLabel(row.type),
    },
    {
      key: 'size',
      header: 'الحجم',
      className: 'disk-col-num',
      render: (row) => (
        <span className="disk-mono" dir="ltr">
          {formatBytes(row.sizeBytes)}
        </span>
      ),
    },
    {
      key: 'fstype',
      header: 'نظام الملفات',
      render: (row) => (
        <span className="disk-mono" dir="ltr">
          {row.fstype || '—'}
        </span>
      ),
    },
    {
      key: 'mount',
      header: 'نقطة التركيب',
      render: (row) =>
        row.mountpoint ? (
          <span className="disk-mono" dir="ltr">
            {row.mountpoint}
          </span>
        ) : (
          <span className="disk-empty">غير مركّب</span>
        ),
    },
    {
      key: 'usage',
      header: 'الاستخدام',
      className: 'disk-col-usage',
      render: (row) => <UsageCell row={row} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'col-actions',
      render: (row) => {
        const isPartition = row.type === 'part' || row.type === 'lvm';
        const canTryMount =
          canMount &&
          isPartition &&
          !!row.fstype &&
          row.fstype !== 'swap' &&
          !row.mountpoint;
        const canTryUnmount =
          canUnmount && row.canUnmount && !!row.mountpoint;

        if (!canTryMount && !canTryUnmount) {
          return <span className="disk-empty">—</span>;
        }

        return (
          <div className="row-actions">
            {canTryMount ? (
              <button
                type="button"
                className="btn secondary btn-sm"
                onClick={() => onMount(row)}
              >
                تركيب
              </button>
            ) : null}
            {canTryUnmount ? (
              <button
                type="button"
                className="btn danger btn-sm"
                onClick={() => {
                  if (!confirm(`فصل ${row.path} عن ${row.mountpoint}؟`)) {
                    return;
                  }
                  onUnmount(row);
                }}
              >
                فصل
              </button>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={partitions}
      rowKey={(r) => r.path}
      emptyText="لا توجد أقسام"
    />
  );
}
