'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createSportTeam,
  updateSportTeam,
  uploadSportTeamLogo,
} from '@/features/live/sports_events/api';
import type {
  SportTeam,
  SportTeamInput,
  SportTeamType,
} from '@/features/live/sports_events/types';
import { SPORT_TEAM_TYPE_LABELS } from '@/features/live/sports_events/types';
import {
  ImageUploadField,
  Modal,
  notifyMutation,
  useToast,
} from '@/shared/ui';

export type TeamModalState = SportTeam | 'new' | null;

type Props = {
  state: TeamModalState;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

const EMPTY: SportTeamInput = {
  name: '',
  type: 'CLUB',
  logoUrl: '',
};

export function TeamModal({ state, onClose, onSaved }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<SportTeamInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isNew = state === 'new';

  useEffect(() => {
    if (!state) return;
    setError(null);
    if (state === 'new') {
      setForm(EMPTY);
      return;
    }
    setForm({
      name: state.name,
      type: state.type,
      logoUrl: state.logoUrl ?? '',
    });
  }, [state]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload: SportTeamInput = {
      name: form.name.trim(),
      type: form.type,
      logoUrl: form.logoUrl?.trim() || null,
    };
    try {
      if (state === 'new') {
        await notifyMutation(toast, () => createSportTeam(payload), {
          success: 'تمت إضافة الفريق',
        });
      } else if (state) {
        await notifyMutation(toast, () => updateSportTeam(state.id, payload), {
          success: 'تم تعديل الفريق',
        });
      }
      onClose();
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={!!state}
      title={isNew ? 'إضافة فريق' : 'تعديل فريق'}
      onClose={onClose}
      footer={
        <div className="modal-footer-actions">
          <button className="btn secondary" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn"
            type="submit"
            form="sport-team-form"
            disabled={busy}
          >
            حفظ
          </button>
        </div>
      }
    >
      <form id="sport-team-form" className="form" onSubmit={submit}>
        {error ? <p className="error">{error}</p> : null}
        <label>
          الاسم
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            minLength={2}
          />
        </label>
        <label>
          النوع
          <select
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as SportTeamType })
            }
            required
          >
            {(Object.keys(SPORT_TEAM_TYPE_LABELS) as SportTeamType[]).map(
              (key) => (
                <option key={key} value={key}>
                  {SPORT_TEAM_TYPE_LABELS[key]}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          الشعار
          <ImageUploadField
            value={form.logoUrl ?? ''}
            onChange={(logoUrl) => setForm({ ...form, logoUrl })}
            onUpload={uploadSportTeamLogo}
            required={false}
          />
        </label>
      </form>
    </Modal>
  );
}
