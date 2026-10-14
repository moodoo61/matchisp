'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { listPublicTodayMatches } from '../../api';
import { DEFAULT_SCHEDULE_TIMEZONE } from '../../lib/scheduleTimezone';
import type { PublicSportMatch } from '../../types';
import { MatchScheduleCard } from './MatchScheduleCard';
import {
  findNearestMatchId,
  groupMatchesByDate,
} from './matchScheduleUtils';
import { scrollScheduleToNearest } from './scrollScheduleToNearest';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectChannel?: (channelId: string) => void;
};

/** نافذة جدول المباريات — عند كل فتح: من الأعلى ثم تمرير سلس لأقرب مباراة */
export function MatchScheduleModal({ open, onClose, onSelectChannel }: Props) {
  const [items, setItems] = useState<PublicSportMatch[]>([]);
  const [timezone, setTimezone] = useState(DEFAULT_SCHEDULE_TIMEZONE);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** يزيد في كل فتح لإعادة تشغيل التمرير حتى لو لم تتغيّر البيانات */
  const [openTick, setOpenTick] = useState(0);
  const [openedAt, setOpenedAt] = useState(() => Date.now());
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const groups = useMemo(
    () => groupMatchesByDate(items, timezone),
    [items, timezone],
  );
  const flatSorted = useMemo(
    () => groups.flatMap((group) => group.matches),
    [groups],
  );
  const nearestId = useMemo(
    () => findNearestMatchId(flatSorted, openedAt, timezone),
    [flatSorted, openedAt, timezone],
  );

  useEffect(() => {
    if (!open) return;

    setOpenedAt(Date.now());
    setOpenTick((n) => n + 1);
    let cancelled = false;
    const hadItems = items.length > 0;
    if (!hadItems) setBusy(true);
    setError(null);

    void listPublicTodayMatches()
      .then((res) => {
        if (!cancelled) {
          setTimezone(res.timezone || DEFAULT_SCHEDULE_TIMEZONE);
          setItems(res.matches);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'تعذر التحميل');
          if (!hadItems) setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });

    return () => {
      cancelled = true;
    };
    // عند كل فتح فقط — لا نعيد الجلب عند تغيّر items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // كل فتح: ابدأ من الأعلى ثم مرّر بسلاسة إلى أقرب مباراة
  useLayoutEffect(() => {
    if (!open || !nearestId || !groups.length) return;
    if (busy && !items.length) return;

    const body = bodyRef.current;
    if (!body) return;

    let cancelled = false;
    const timers: number[] = [];

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timers.push(id);
    };

    // إظهار البداية من أول بطاقة قبل التمرير
    body.scrollTop = 0;

    const runScroll = (attempt: number) => {
      if (cancelled) return;

      const safeId = nearestId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const target = body.querySelector<HTMLElement>(
        `[data-schedule-match-id="${safeId}"]`,
      );

      if (!target) {
        if (attempt < 24) schedule(() => runScroll(attempt + 1), 40);
        return;
      }

      const overflow = body.scrollHeight - body.clientHeight;
      if (overflow <= 0) {
        if (attempt < 24) schedule(() => runScroll(attempt + 1), 40);
        return;
      }

      // تأكيد البداية من الأعلى حتى يظهر التمرير للمستخدم
      if (body.scrollTop > 0) body.scrollTop = 0;

      const ok = scrollScheduleToNearest(body, target, 'smooth');
      if (!ok && attempt < 24) {
        schedule(() => runScroll(attempt + 1), 50);
      }
    };

    // انتظر انتهاء ظهور النافذة قليلاً حتى تثبت الأبعاد ويُرى أعلى القائمة
    schedule(() => runScroll(0), 120);

    return () => {
      cancelled = true;
      for (const id of timers) window.clearTimeout(id);
    };
  }, [open, openTick, busy, nearestId, groups.length, items.length]);

  if (!open) return null;

  const selectChannel = (channelId: string) => {
    onSelectChannel?.(channelId);
    onClose();
  };

  const showLoading = busy && !items.length;
  const showList = groups.length > 0;

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
          {showLoading ? (
            <p className="cl-schedule-hint">جاري التحميل…</p>
          ) : null}
          {!showLoading && error && !showList ? (
            <p className="cl-schedule-hint is-error">{error}</p>
          ) : null}
          {!showLoading && !error && !showList ? (
            <p className="cl-schedule-hint">لا توجد مباريات في الجدول.</p>
          ) : null}

          {showList ? (
            <div className="cl-schedule-groups">
              {groups.map((group) => (
                <section key={group.key} className="cl-schedule-group">
                  <h3 className="cl-schedule-group-title">{group.label}</h3>
                  <ul className="cl-schedule-list">
                    {group.matches.map((match) => (
                      <li key={match.id}>
                        <MatchScheduleCard
                          match={match}
                          timeZone={timezone}
                          onSelectChannel={selectChannel}
                        />
                      </li>
                    ))}
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
