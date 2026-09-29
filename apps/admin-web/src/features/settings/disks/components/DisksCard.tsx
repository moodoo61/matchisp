'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  getDisksInventory,
  unmountDisk,
} from '@/features/settings/disks/api';
import type {
  BlockDeviceNode,
  DisksInventory,
} from '@/features/settings/disks/types';
import { formatBytes } from '@/features/settings/disks/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  IconButton,
  TaskCard,
  notifyMutation,
  useToast,
} from '@/shared/ui';
import { DiskDeviceCard } from './DiskDeviceCard';
import { MountDiskModal } from './MountDiskModal';

export function DisksCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.SETTINGS_DISKS_READ);
  const canMount = can(PERMISSIONS.SETTINGS_DISKS_MOUNT);
  const canUnmount = can(PERMISSIONS.SETTINGS_DISKS_UNMOUNT);
  const toast = useToast();

  const [data, setData] = useState<DisksInventory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mountTarget, setMountTarget] = useState<BlockDeviceNode | null>(null);

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      setData(await getDisksInventory());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب الأقراص');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
  }, [canRead, reload]);

  async function handleUnmount(device: BlockDeviceNode) {
    try {
      await notifyMutation(
        toast,
        () =>
          unmountDisk({
            devicePath: device.path,
            mountpoint: device.mountpoint ?? undefined,
          }),
        { success: `تم فصل ${device.path}` },
      );
      await reload();
    } catch {
      /* toast */
    }
  }

  if (!canRead) return null;

  const disks = data?.devices.filter((d) => d.type === 'disk') ?? [];
  const other = data?.devices.filter((d) => d.type !== 'disk') ?? [];

  return (
    <>
      <TaskCard
        title="إدارة الأقراص"
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

        {data ? (
          <p className="disk-checked muted">
            آخر تحديث: {new Date(data.checkedAt).toLocaleString('ar')}
          </p>
        ) : null}

        {!data && !error ? <p className="muted">جاري القراءة…</p> : null}

        {data ? (
          <div className="disk-list">
            {disks.map((disk) => (
              <DiskDeviceCard
                key={disk.path}
                disk={disk}
                canMount={canMount}
                canUnmount={canUnmount}
                onMount={setMountTarget}
                onUnmount={(d) => void handleUnmount(d)}
              />
            ))}

            {other.map((disk) => (
              <DiskDeviceCard
                key={disk.path}
                disk={disk}
                canMount={canMount}
                canUnmount={canUnmount}
                onMount={setMountTarget}
                onUnmount={(d) => void handleUnmount(d)}
              />
            ))}

            {!disks.length && !other.length ? (
              <p className="muted">لا توجد أقراص مكتشفة</p>
            ) : null}
          </div>
        ) : null}

        {data?.mounts.length ? (
          <section className="disk-mounts">
            <h3 className="disk-mounts-title">نقاط التركيب النشطة</h3>
            <div className="table-wrap">
              <table className="table disk-mounts-table">
                <thead>
                  <tr>
                    <th>المسار</th>
                    <th>الجهاز</th>
                    <th>النوع</th>
                    <th>المستخدم</th>
                    <th>المتاح</th>
                    <th>الإجمالي</th>
                    <th>النسبة</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mounts.map((m) => (
                    <tr key={m.mountpoint}>
                      <td>
                        <span className="disk-mono" dir="ltr">
                          {m.mountpoint}
                        </span>
                      </td>
                      <td>
                        <span className="disk-mono" dir="ltr">
                          {m.filesystem}
                        </span>
                      </td>
                      <td>
                        <span className="disk-mono" dir="ltr">
                          {m.fstype}
                        </span>
                      </td>
                      <td className="disk-col-num">
                        <span className="disk-mono" dir="ltr">
                          {formatBytes(m.usedBytes)}
                        </span>
                      </td>
                      <td className="disk-col-num">
                        <span className="disk-mono" dir="ltr">
                          {formatBytes(m.availBytes)}
                        </span>
                      </td>
                      <td className="disk-col-num">
                        <span className="disk-mono" dir="ltr">
                          {formatBytes(m.sizeBytes)}
                        </span>
                      </td>
                      <td className="disk-col-num">{m.capacityPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </TaskCard>

      <MountDiskModal
        device={mountTarget}
        onClose={() => setMountTarget(null)}
        onDone={reload}
      />
    </>
  );
}
