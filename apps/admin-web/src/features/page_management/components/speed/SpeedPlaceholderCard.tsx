'use client';

import { TaskCard } from '@/shared/ui';

/** مساحة فارغة — تُجهَّز لاحقاً */
export function SpeedPlaceholderCard() {
  return (
    <TaskCard title="خيارات السرعة">
      <p className="table-empty">لا توجد مهام بعد</p>
    </TaskCard>
  );
}
