'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

/** أقرب مباراة للوقت الحالي (جارية أو القادمة) */
function findNearestMatchId(items: PublicSportMatch[], nowMs: number) {
  if (!items.length) return null;
  let bestId = items[0].id;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const match of items) {
    const kickoff = new Date(match.kickoffAt).getTime();
    if (Number.isNaN(kickoff)) continue;
    // مباراة جارية خلال ساعتين من البداية لها أولوية أعلى قليلاً
    const elapsed = nowMs - kickoff;
    const score =
      elapsed >= 0 && elapsed <= 2 * 60 * 60 * 1000
        ? elapsed / 4
        : Math.abs(elapsed);
    if (score < bestScore) {
      bestScore = score;
      bestId = match.id;
    }
  }
  return bestId;
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
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const nearestRef = useRef<HTMLButtonElement | null>(null);

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
      ),
    [items],
  );

  const nearestId = useMemo(
    () => findNearestMatchId(sortedItems, Date.now()),
    [sortedItems],
  );

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

  useEffect(() => {
    if (!open || busy || !nearestId) return;
    const frame = window.requestAnimationFrame(() => {
      nearestRef.current?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, busy, nearestId, sortedItems.length]);

  if (!open) return null;

  const selectMatch = (match: PublicSportMatch) => {
    onSelectChannel?.(match.channel.id);
    onClose();
  };

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

        <div className="cl-schedule-body" ref={bodyRef}>
          {busy ? <p className="cl-schedule-hint">جاري التحميل…</p> : null}
          {!busy && error ? (
            <p className="cl-schedule-hint is-error">{error}</p>
          ) : null}
          {!busy && !error && !sortedItems.length ? (
            <p className="cl-schedule-hint">لا توجد مباريات لهذا اليوم.</p>
          ) : null}

          {!busy && sortedItems.length ? (
            <>
              <div className="cl-schedule-cols" aria-hidden>
                <span>الوقت</span>
                <span>المباراة</span>
                <span>البطولة</span>
                <span>القناة</span>
              </div>
              <ul className="cl-schedule-list">
                {sortedItems.map((match) => {
                  const isNearest = match.id === nearestId;
                  return (
                    <li key={match.id}>
                      <button
                        type="button"
                        className={
                          isNearest
                            ? 'cl-schedule-row is-nearest'
                            : 'cl-schedule-row'
                        }
                        ref={isNearest ? nearestRef : undefined}
                        onClick={() => selectMatch(match)}
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
                        <span className="cl-schedule-tournament">
                          {match.tournament}
                        </span>
                        <span className="cl-schedule-channel">
                          {match.channel.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
