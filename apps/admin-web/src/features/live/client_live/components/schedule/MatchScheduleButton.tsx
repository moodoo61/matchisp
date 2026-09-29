'use client';

import { useState } from 'react';
import { MatchScheduleModal } from './MatchScheduleModal';

type Props = {
  onSelectChannel?: (channelId: string) => void;
};

/** زر فتح جدول مباريات اليوم في صفحة المشاهدة */
export function MatchScheduleButton({ onSelectChannel }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="cl-schedule-btn"
        onClick={() => setOpen(true)}
      >
        جدول المباريات
      </button>
      <MatchScheduleModal
        open={open}
        onClose={() => setOpen(false)}
        onSelectChannel={onSelectChannel}
      />
    </>
  );
}
