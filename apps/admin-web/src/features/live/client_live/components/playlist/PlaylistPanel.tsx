'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { compareBySortOrderThenLabel } from '../../lib/naturalSort';
import type { ViewingPlayerId } from '../../lib/players';
import type { PublicLiveSection } from '../../types';
import { PlaylistRow } from './PlaylistRow';

type Props = {
  sections: PublicLiveSection[];
  selectedId: string | null;
  players: ViewingPlayerId[];
  activePlayer: ViewingPlayerId;
  onSelect: (id: string) => void;
  onSelectPlayer: (id: string, player: ViewingPlayerId) => void;
};

/** قائمة التشغيل — العنوان والأقسام في صف واحد */
export function PlaylistPanel({
  sections,
  selectedId,
  players,
  activePlayer,
  onSelect,
  onSelectPlayer,
}: Props) {
  const selectedRef = useRef<HTMLButtonElement | null>(null);
  const orderedSections = useMemo(
    () => [...sections].sort(compareBySortOrderThenLabel),
    [sections],
  );

  const sectionOfSelected = useMemo(() => {
    if (!selectedId) return null;
    return (
      orderedSections.find((section) =>
        section.channels.some((channel) => channel.id === selectedId),
      )?.id ?? null
    );
  }, [orderedSections, selectedId]);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    () => sectionOfSelected ?? orderedSections[0]?.id ?? null,
  );

  useEffect(() => {
    if (!orderedSections.length) {
      setActiveSectionId(null);
      return;
    }
    setActiveSectionId((current) => {
      if (current && orderedSections.some((section) => section.id === current)) {
        return current;
      }
      return orderedSections[0]?.id ?? null;
    });
  }, [orderedSections]);

  useEffect(() => {
    if (sectionOfSelected) setActiveSectionId(sectionOfSelected);
  }, [sectionOfSelected]);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedId, activeSectionId]);

  const activeSection =
    orderedSections.find((section) => section.id === activeSectionId) ?? null;

  if (!orderedSections.length) return null;

  return (
    <aside className="cl-playlist" aria-label="قائمة القنوات">
      <div className="cl-playlist-head">
        <h2>القنوات</h2>
        <div
          className="cl-playlist-tabs"
          role="tablist"
          aria-label="أقسام القنوات"
        >
          {orderedSections.map((section) => {
            const active = section.id === activeSectionId;
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={
                  active ? 'cl-playlist-tab is-active' : 'cl-playlist-tab'
                }
                onClick={() => setActiveSectionId(section.id)}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="cl-playlist-body" role="tabpanel">
        {activeSection ? (
          activeSection.channels.length ? (
            <ul className="cl-playlist-list">
              {[...activeSection.channels]
                .sort(compareBySortOrderThenLabel)
                .map((channel) => (
                  <PlaylistRow
                    key={channel.id}
                    channel={channel}
                    selected={channel.id === selectedId}
                    buttonRef={
                      channel.id === selectedId ? selectedRef : undefined
                    }
                    players={players}
                    activePlayer={activePlayer}
                    onSelect={onSelect}
                    onSelectPlayer={onSelectPlayer}
                  />
                ))}
            </ul>
          ) : (
            <p className="cl-playlist-empty">لا توجد قنوات في هذا القسم</p>
          )
        ) : null}
      </div>
    </aside>
  );
}
