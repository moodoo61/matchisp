'use client';

import { FormEvent, useEffect, useState } from 'react';
import { mountDisk } from '@/features/settings/disks/api';
import type { BlockDeviceNode } from '@/features/settings/disks/types';
import { Modal, notifyMutation, useToast } from '@/shared/ui';

type Props = {
  device: BlockDeviceNode | null;
  onClose: () => void;
  onDone: () => Promise<void>;
};

export function MountDiskModal({ device, onClose, onDone }: Props) {
  const toast = useToast();
  const [mountpoint, setMountpoint] = useState('/mnt/data');
  const [options, setOptions] = useState('defaults');
  const [createDir, setCreateDir] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!device) return;
    setError(null);
    setMountpoint(`/mnt/${device.name}`);
    setOptions('defaults');
    setCreateDir(true);
  }, [device]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!device) return;
    setBusy(true);
    setError(null);
    try {
      await notifyMutation(
        toast,
        () =>
          mountDisk({
            devicePath: device.path,
            mountpoint,
            options: options.trim() || undefined,
            createDir,
          }),
        { success: `تم تركيب ${device.path}` },
      );
      onClose();
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل التركيب');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={!!device}
      title={device ? `تركيب ${device.path}` : 'تركيب قرص'}
      onClose={onClose}
      footer={
        <div className="modal-footer-actions">
          <button className="btn secondary" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn"
            type="submit"
            form="settings-mount-disk-form"
            disabled={busy}
          >
            تركيب
          </button>
        </div>
      }
    >
      <form id="settings-mount-disk-form" className="form" onSubmit={submit}>
        {error ? <p className="error">{error}</p> : null}
        <label>
          نقطة التركيب
          <input
            dir="ltr"
            value={mountpoint}
            onChange={(e) => setMountpoint(e.target.value)}
            required
            placeholder="/mnt/data"
          />
        </label>
        <label>
          خيارات mount
          <input
            dir="ltr"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="defaults,noatime"
          />
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={createDir}
            onChange={(e) => setCreateDir(e.target.checked)}
          />
          إنشاء المجلد إن لم يكن موجوداً
        </label>
      </form>
    </Modal>
  );
}
