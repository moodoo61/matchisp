'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '@/shared/ui';
import { PermissionPicker } from './PermissionPicker';
import type { RolePermission } from '../types';

type Props = {
  open: boolean;
  permissions: RolePermission[];
  busy?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    code: string;
    name: string;
    description: string;
    permissionIds: string[];
  }) => Promise<void>;
};

export function RoleCreateModal({
  open,
  permissions,
  busy = false,
  onClose,
  onSubmit,
}: Props) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissionIds, setPermissionIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setCode('');
    setName('');
    setDescription('');
    setPermissionIds([]);
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit({
      code: code.trim(),
      name: name.trim(),
      description: description.trim(),
      permissionIds,
    });
  }

  return (
    <Modal
      open={open}
      title="دور جديد"
      onClose={onClose}
      panelClassName="roles-create-modal"
      footer={
        <div className="modal-footer-actions">
          <button
            className="btn secondary"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            إلغاء
          </button>
          <button
            className="btn"
            type="submit"
            form="roles-create-form"
            disabled={busy}
          >
            {busy ? 'جاري الحفظ...' : 'حفظ الدور'}
          </button>
        </div>
      }
    >
      <div className="roles-create-layout">
        <form
          id="roles-create-form"
          className="form roles-create-fields"
          onSubmit={handleSubmit}
        >
          <div className="roles-create-grid">
            <label>
              الرمز (إنجليزي)
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                pattern="[a-z0-9_\-]+"
                title="حروف إنجليزية صغيرة وأرقام و _ فقط"
                disabled={busy}
                autoComplete="off"
              />
            </label>
            <label>
              الاسم
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={busy}
              />
            </label>
          </div>
          <label>
            الوصف
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
            />
          </label>
        </form>

        <div className="roles-perm-field">
          <div className="roles-perm-field-head">
            <span>الصلاحيات حسب هيكل النظام</span>
            <span className="muted">{permissionIds.length} محدّدة</span>
          </div>
          <PermissionPicker
            permissions={permissions}
            selectedIds={permissionIds}
            onChange={setPermissionIds}
          />
        </div>
      </div>
    </Modal>
  );
}
