'use client';

import { useEffect, useRef } from 'react';
import type { PublicLiveSection } from '../../types';
import { PlaylistRow } from './PlaylistRow';

type Props = {
  sections: PublicLiveSection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/** قائمة التشغيل الجانبية — أقسام مكدسة بدون بحث وبدون تبويبات */
export function PlaylistPanel({ sections, selectedId, onSelect }: Props) {
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  if (!sections.length) return null;

  return (
    <aside className="cl-playlist" aria-label="قائمة القنوات">
      <div className="cl-playlist-head">
        <h2>القنوات</h2>
        <p>اختر للمشاهدة الفورية</p>
      </div>

      <div className="cl-playlist-body">
        {sections.map((section) => (
          <section key={section.id} className="cl-playlist-section">
            <h3>{section.label}</h3>
            <ul className="cl-playlist-list">
              {section.channels.map((channel) => (
                <PlaylistRow
                  key={channel.id}
                  channel={channel}
                  selected={channel.id === selectedId}
                  buttonRef={channel.id === selectedId ? selectedRef : undefined}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}
