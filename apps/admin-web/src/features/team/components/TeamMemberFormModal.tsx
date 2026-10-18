'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '@/shared/ui';
import type { TeamMember, TeamRoleOption } from '../types';

type Props = {
  open: boolean;
  roles: TeamRoleOption[];
  member?: TeamMember | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    username: string;
    password: string;
    status: 'ACTIVE' | 'INACTIVE';
    roleIds: string[];
  }) => Promise<void>;
};

export function TeamMemberFormModal({
  open,
  roles,
  member = null,
  busy = false,
  onClose,
  onSubmit,
}: Props) {
  const editing = Boolean(member);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [roleIds, setRoleIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    if (member) {
      setName(member.name);
      setUsername(member.username);
      setPassword('');
      setStatus(member.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
      setRoleIds(member.roles.map((r) => r.id));
    } else {
      setName('');
      setUsername('');
      setPassword('');
      setStatus('ACTIVE');
      setRoleIds([]);
    }
  }, [open, member]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit({
      name: name.trim(),
      username: username.trim(),
      password,
      status,
      roleIds,
    });
  }

  return (
    <Modal
      open={open}
      title={editing ? `تعديل عضو — ${member?.name ?? ''}` : 'إضافة عضو'}
      onClose={onClose}
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
            form="team-member-form"
            disabled={busy}
          >
            {busy ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'حفظ العضو'}
          </button>
        </div>
      }
    >
      <form
        id="team-member-form"
        className="form form-wide"
        onSubmit={handleSubmit}
      >
        <label>
          الاسم
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            disabled={busy}
          />
        </label>
        <label>
          اسم الدخول
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            disabled={busy || editing}
            autoComplete="off"
          />
        </label>
        <label>
          كلمة المرور
          {editing ? ' (اتركها فارغة إن لم تتغير)' : ''}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!editing}
            minLength={editing ? undefined : 6}
            disabled={busy}
            autoComplete="new-password"
          />
        </label>
        {editing ? (
          <label>
            الحالة
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')
              }
              disabled={busy}
            >
              <option value="ACTIVE">نشط</option>
              <option value="INACTIVE">موقوف</option>
            </select>
          </label>
        ) : null}
        <label>
          الأدوار
          <select
            multiple
            value={roleIds}
            onChange={(e) =>
              setRoleIds(
                Array.from(e.target.selectedOptions).map((o) => o.value),
              )
            }
            style={{ minHeight: 110 }}
            disabled={busy}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </form>
    </Modal>
  );
}
