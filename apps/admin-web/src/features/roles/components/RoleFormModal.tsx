'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '@/shared/ui';
import { PermissionPicker } from './PermissionPicker';
import type { RolePermission, RoleRow } from '../types';

type Props = {
  open: boolean;
  permissions: RolePermission[];
  /** إن وُجد = وضع تعديل */
  role?: RoleRow | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    code: string;
    name: string;
    description: string;
    permissionIds: string[];
  }) => Promise<void>;
};

export function RoleFormModal({
  open,
  permissions,
  role = null,
  busy = false,
  onClose,
  onSubmit,
}: Props) {
  const editing = Boolean(role);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissionIds, setPermissionIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    if (role) {
      setCode(role.code);
      setName(role.name);
      setDescription(role.description ?? '');
      setPermissionIds(role.permissions.map((p) => p.id));
    } else {
      setCode('');
      setName('');
      setDescription('');
      setPermissionIds([]);
    }
  }, [open, role]);

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
      title={editing ? `تعديل الدور — ${role?.name ?? ''}` : 'دور جديد'}
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
            form="roles-form"
            disabled={busy}
          >
            {busy ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'حفظ الدور'}
          </button>
        </div>
      }
    >
      <div className="roles-create-layout">
        <form
          id="roles-form"
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
                disabled={busy || editing}
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
