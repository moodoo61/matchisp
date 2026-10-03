'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createSportMatch,
  listSportMatchChannelOptions,
  listSportTeams,
  updateSportMatch,
} from '@/features/live/sports_events/api';
import { MatchKickoffField } from '@/features/live/sports_events/components/matches/MatchKickoffField';
import type {
  SportMatch,
  SportMatchInput,
  SportTeam,
} from '@/features/live/sports_events/types';
import {
  defaultKickoffParts,
  partsFromIso,
  partsToIso,
  type KickoffParts,
} from '@/features/live/sports_events/utils/datetime';
import { Modal, notifyMutation, useToast } from '@/shared/ui';

export type MatchModalState = SportMatch | 'new' | null;

type Props = {
  state: MatchModalState;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

type ChannelOption = { id: string; name: string; label: string };

type FormState = {
  tournament: string;
  homeTeamId: string;
  awayTeamId: string;
  channelId: string;
  kickoff: KickoffParts;
};

const EMPTY: FormState = {
  tournament: '',
  homeTeamId: '',
  awayTeamId: '',
  channelId: '',
  kickoff: defaultKickoffParts(),
};

export function MatchModal({ state, onClose, onSaved }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [teams, setTeams] = useState<SportTeam[]>([]);
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isNew = state === 'new';

  useEffect(() => {
    if (!state) return;
    setError(null);
    void Promise.all([listSportTeams(), listSportMatchChannelOptions()])
      .then(([t, c]) => {
        setTeams(t);
        setChannels(c);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'تعذر تحميل البيانات'),
      );

    if (state === 'new') {
      setForm({ ...EMPTY, kickoff: defaultKickoffParts() });
      return;
    }
    setForm({
      tournament: state.tournament,
      homeTeamId: state.homeTeamId,
      awayTeamId: state.awayTeamId,
      channelId: state.channelId ?? '',
      kickoff: partsFromIso(state.kickoffAt),
    });
  }, [state]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload: SportMatchInput = {
      tournament: form.tournament.trim(),
      homeTeamId: form.homeTeamId,
      awayTeamId: form.awayTeamId,
      channelId: form.channelId,
      kickoffAt: partsToIso(form.kickoff),
    };
    try {
      if (state === 'new') {
        await notifyMutation(toast, () => createSportMatch(payload), {
          success: 'تمت إضافة المباراة',
        });
      } else if (state) {
        await notifyMutation(toast, () => updateSportMatch(state.id, payload), {
          success: 'تم تعديل المباراة',
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
      title={isNew ? 'إضافة مباراة' : 'تعديل مباراة'}
      onClose={onClose}
      footer={
        <div className="modal-footer-actions">
          <button className="btn secondary" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn"
            type="submit"
            form="sport-match-form"
            disabled={busy}
          >
            حفظ
          </button>
        </div>
      }
    >
      <form id="sport-match-form" className="form" onSubmit={submit}>
        {error ? <p className="error">{error}</p> : null}
        <label>
          البطولة
          <input
            value={form.tournament}
            onChange={(e) => setForm({ ...form, tournament: e.target.value })}
            required
            minLength={2}
          />
        </label>
        <label>
          الفريق الأول
          <select
            value={form.homeTeamId}
            onChange={(e) => setForm({ ...form, homeTeamId: e.target.value })}
            required
          >
            <option value="">— اختر —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          الفريق الثاني
          <select
            value={form.awayTeamId}
            onChange={(e) => setForm({ ...form, awayTeamId: e.target.value })}
            required
          >
            <option value="">— اختر —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <MatchKickoffField
          value={form.kickoff}
          disabled={busy}
          onChange={(kickoff) => setForm({ ...form, kickoff })}
        />

        <label>
          القناة
          <select
            value={form.channelId}
            onChange={(e) => setForm({ ...form, channelId: e.target.value })}
            required
          >
            <option value="">— اختر —</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </form>
    </Modal>
  );
}
