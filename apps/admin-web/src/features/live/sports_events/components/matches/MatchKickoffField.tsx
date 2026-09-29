'use client';

import type { KickoffParts } from '@/features/live/sports_events/utils/datetime';

type Props = {
  value: KickoffParts;
  onChange: (next: KickoffParts) => void;
  disabled?: boolean;
};

/**
 * موعد بسيط: تقويم أصلي + ساعة أصلية
 * (الضغط يفتح منتقي النظام مباشرة)
 */
export function MatchKickoffField({ value, onChange, disabled }: Props) {
  return (
    <div className="match-kickoff-field">
      <label>
        التاريخ
        <input
          type="date"
          value={value.day}
          disabled={disabled}
          required
          onChange={(e) => onChange({ ...value, day: e.target.value })}
        />
      </label>
      <label>
        الوقت
        <input
          type="time"
          value={value.time}
          disabled={disabled}
          required
          onChange={(e) => onChange({ ...value, time: e.target.value })}
        />
      </label>
    </div>
  );
}
