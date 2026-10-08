'use client';

import { useState } from 'react';
import { ViewingReportsChannelsChart } from '@/features/live/viewing_reports/components/ViewingReportsChannelsChart';
import { ViewingReportsSessionsTimelineChart } from '@/features/live/viewing_reports/components/ViewingReportsSessionsTimelineChart';
import {
  DEFAULT_VIEWING_REPORTS_PERIOD_HOURS,
  VIEWING_REPORTS_PERIODS,
} from '@/features/live/viewing_reports/lib/periods';
import { TaskCard } from '@/shared/ui';

/** بطاقة واحدة: رسما القنوات والجلسات مع فترة موحّدة */
export function ViewingReportsChartsCard() {
  const [hours, setHours] = useState(DEFAULT_VIEWING_REPORTS_PERIOD_HOURS);

  return (
    <TaskCard
      title="رسوم المشاهدة"
      actions={
        <div className="viewing-reports-periods" role="group" aria-label="الفترة">
          {VIEWING_REPORTS_PERIODS.map((p) => (
            <button
              key={p.hours}
              type="button"
              className={`btn btn-sm${hours === p.hours ? '' : ' secondary'}`}
              onClick={() => setHours(p.hours)}
            >
              {p.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="viewing-reports-charts">
        <ViewingReportsChannelsChart hours={hours} />
        <ViewingReportsSessionsTimelineChart hours={hours} />
        <h3 id="vr-channels-title" className="viewing-reports-chart-title">
          ساعات المشاهدة
        </h3>
        <h3 id="vr-timeline-title" className="viewing-reports-chart-title">
          جلسات المشاهدة
        </h3>
      </div>
    </TaskCard>
  );
}
