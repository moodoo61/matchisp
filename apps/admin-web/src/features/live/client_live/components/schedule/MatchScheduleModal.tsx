'use client';

import { useEffect, useState } from 'react';
import { listPublicTodayMatches } from '../../api';
import type { PublicSportMatch } from '../../types';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectChannel?: (channelId: string) => void;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
}

function TeamCell({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  return (
    <span className="cl-schedule-team">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="cl-schedule-logo" />
      ) : (
        <span className="cl-schedule-logo is-empty" aria-hidden />
      )}
      <span>{name}</span>
    </span>
  );
}

/** نافذة جدول مباريات اليوم */
export function MatchScheduleModal({ open, onClose, onSelectChannel }: Props) {
  const [items, setItems] = useState<PublicSportMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setBusy(true);
    setError(null);
    void listPublicTodayMatches()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'تعذر التحميل');
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="cl-schedule-overlay" role="presentation" onClick={onClose}>
      <div
        className="cl-schedule-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cl-schedule-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cl-schedule-head">
          <h2 id="cl-schedule-title">جدول المباريات</h2>
          <button
            type="button"
            className="cl-schedule-close"
            aria-label="إغلاق"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="cl-schedule-body">
          {busy ? <p className="cl-schedule-hint">جاري التحميل…</p> : null}
          {!busy && error ? (
            <p className="cl-schedule-hint is-error">{error}</p>
          ) : null}
          {!busy && !error && !items.length ? (
            <p className="cl-schedule-hint">لا توجد مباريات لهذا اليوم.</p>
          ) : null}

          {!busy && items.length ? (
            <ul className="cl-schedule-list">
              {items.map((match) => (
                <li key={match.id}>
                  <button
                    type="button"
                    className="cl-schedule-row"
                    onClick={() => {
                      onSelectChannel?.(match.channel.id);
                      onClose();
                    }}
                  >
                    <span className="cl-schedule-time">
                      {formatTime(match.kickoffAt)}
                    </span>
                    <span className="cl-schedule-fixture">
                      <TeamCell
                        name={match.homeTeam.name}
                        logoUrl={match.homeTeam.logoUrl}
                      />
                      <span className="cl-schedule-vs">×</span>
                      <TeamCell
                        name={match.awayTeam.name}
                        logoUrl={match.awayTeam.logoUrl}
                      />
                    </span>
                    <span className="cl-schedule-meta">
                      <span className="cl-schedule-tournament">
                        {match.tournament}
                      </span>
                      <span className="cl-schedule-channel">
                        {match.channel.label}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
