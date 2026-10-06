'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { listPublicTodayMatches } from '../../api';
import type { PublicSportMatch } from '../../types';
import { MatchScheduleCard } from './MatchScheduleCard';
import {
  findNearestMatchId,
  groupMatchesByDate,
} from './matchScheduleUtils';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectChannel?: (channelId: string) => void;
};

/** نافذة جدول المباريات — مجمّعة بالتاريخ مع أهداف وقنوات متعددة */
export function MatchScheduleModal({ open, onClose, onSelectChannel }: Props) {
  const [items, setItems] = useState<PublicSportMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nearestRef = useRef<HTMLDivElement | null>(null);

  const groups = useMemo(() => groupMatchesByDate(items), [items]);
  const flatSorted = useMemo(
    () => groups.flatMap((group) => group.matches),
    [groups],
  );
  const nearestId = useMemo(
    () => findNearestMatchId(flatSorted, Date.now()),
    [flatSorted],
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
  }, [open, busy, nearestId, flatSorted.length]);

  if (!open) return null;

  const selectChannel = (channelId: string) => {
    onSelectChannel?.(channelId);
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

        <div className="cl-schedule-body">
          {busy ? <p className="cl-schedule-hint">جاري التحميل…</p> : null}
          {!busy && error ? (
            <p className="cl-schedule-hint is-error">{error}</p>
          ) : null}
          {!busy && !error && !groups.length ? (
            <p className="cl-schedule-hint">لا توجد مباريات في الجدول.</p>
          ) : null}

          {!busy && groups.length ? (
            <div className="cl-schedule-groups">
              {groups.map((group) => (
                <section key={group.key} className="cl-schedule-group">
                  <h3 className="cl-schedule-group-title">{group.label}</h3>
                  <ul className="cl-schedule-list">
                    {group.matches.map((match) => {
                      const isNearest = match.id === nearestId;
                      return (
                        <li key={match.id}>
                          <MatchScheduleCard
                            match={match}
                            nearest={isNearest}
                            cardRef={isNearest ? nearestRef : undefined}
                            onSelectChannel={selectChannel}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
