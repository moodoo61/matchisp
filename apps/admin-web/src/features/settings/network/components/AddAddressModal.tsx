'use client';

import { FormEvent, useEffect, useState } from 'react';
import { addInterfaceAddress } from '@/features/settings/network/api';
import type { NetworkInterface } from '@/features/settings/network/types';
import { Modal, notifyMutation, useToast } from '@/shared/ui';

type Props = {
  iface: NetworkInterface | null;
  onClose: () => void;
  onDone: () => Promise<void>;
};

export function AddAddressModal({ iface, onClose, onDone }: Props) {
  const toast = useToast();
  const [cidr, setCidr] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!iface) return;
    setCidr('');
    setError(null);
  }, [iface]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!iface) return;
    setBusy(true);
    setError(null);
    try {
      await notifyMutation(
        toast,
        () => addInterfaceAddress(iface.ifName, cidr.trim()),
        { success: `تمت إضافة ${cidr} إلى ${iface.ifName}` },
      );
      onClose();
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={!!iface}
      title={iface ? `إضافة عنوان — ${iface.ifName}` : 'إضافة عنوان'}
      onClose={onClose}
      footer={
        <div className="modal-footer-actions">
          <button className="btn secondary" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn"
            type="submit"
            form="network-add-addr-form"
            disabled={busy}
          >
            إضافة
          </button>
        </div>
      }
    >
      <form id="network-add-addr-form" className="form" onSubmit={submit}>
        {error ? <p className="error">{error}</p> : null}
        <label>
          العنوان (CIDR)
          <input
            dir="ltr"
            value={cidr}
            onChange={(e) => setCidr(e.target.value)}
            placeholder="192.168.10.50/24"
            required
          />
        </label>
      </form>
    </Modal>
  );
}
