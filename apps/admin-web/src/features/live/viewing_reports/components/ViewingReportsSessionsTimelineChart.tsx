'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getViewingReportsTimeline } from '@/features/live/viewing_reports/api';
import type { ViewingReportsTimeline } from '@/features/live/viewing_reports/types';

const CHART_W = 720;
const CHART_H = 248;
const PAD = { top: 22, right: 16, bottom: 36, left: 48 };

function axisLabel(
  key: string,
  bucket: 'hour' | 'day',
  periodHours: number,
): string {
  if (bucket === 'hour') {
    const [date, hour] = key.split('T');
    if (!date || hour == null) return key;
    if (periodHours <= 24) return `${hour}:00`;
    if (hour === '00') return date.slice(5);
    return `${hour}:00`;
  }
  return key.slice(5);
}

function tooltipLabel(key: string, bucket: 'hour' | 'day'): string {
  if (bucket === 'hour') {
    const [date, hour] = key.split('T');
    return `${date} ${hour}:00`;
  }
  return key;
}

type Props = { hours: number };

/** رسم خطي: عدد الجلسات عبر الزمن */
export function ViewingReportsSessionsTimelineChart({ hours }: Props) {
  const [data, setData] = useState<ViewingReportsTimeline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async (periodHours: number) => {
    setLoading(true);
    try {
      const next = await getViewingReportsTimeline(periodHours);
      setData(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر التحميل');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload(hours);
  }, [hours, reload]);

  const series = useMemo(() => data?.points ?? [], [data]);
  const bucket = data?.bucket ?? 'hour';

  const maxY = Math.max(1, ...series.map((p) => p.sessions));
  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const n = series.length;

  const points = series.map((p, i) => {
    const x =
      n <= 1 ? PAD.left + plotW / 2 : PAD.left + (i / (n - 1)) * plotW;
    const y = PAD.top + plotH * (1 - p.sessions / maxY);
    return { ...p, x, y };
  });

  const lineD =
    points.length > 0
      ? points
          .map(
            (p, i) =>
              `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
          )
          .join(' ')
      : '';

  const areaD =
    points.length > 0
      ? `${lineD} L ${points[points.length - 1]!.x.toFixed(1)} ${(PAD.top + plotH).toFixed(1)} L ${points[0]!.x.toFixed(1)} ${(PAD.top + plotH).toFixed(1)} Z`
      : '';

  const labelStep =
    bucket === 'hour'
      ? hours <= 24
        ? 2
        : Math.max(1, Math.ceil(n / 12))
      : Math.max(1, Math.ceil(n / 8));

  return (
    <section className="viewing-reports-chart-section" aria-labelledby="vr-timeline-title">
      {error ? <p className="error">{error}</p> : null}
      {loading && !data ? <p className="muted">جاري التحميل…</p> : null}
      {!loading && series.every((p) => p.sessions === 0) ? (
        <p className="muted">لا جلسات في هذه الفترة</p>
      ) : null}

      {series.length ? (
        <div className="viewing-reports-vchart-wrap">
          <svg
            className="viewing-reports-vchart viewing-reports-tchart"
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            role="img"
            aria-label="جلسات المشاهدة"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const y = PAD.top + plotH * (1 - t);
              const val = Math.round(maxY * t);
              return (
                <g key={t}>
                  <line
                    x1={PAD.left}
                    x2={CHART_W - PAD.right}
                    y1={y}
                    y2={y}
                    className="viewing-reports-vchart-grid"
                  />
                  <text
                    x={PAD.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="viewing-reports-vchart-axis"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {areaD ? (
              <path d={areaD} className="viewing-reports-tchart-area" />
            ) : null}
            {lineD ? (
              <path d={lineD} className="viewing-reports-tchart-line" />
            ) : null}

            {points.map((p) =>
              p.sessions > 0 ? (
                <circle
                  key={p.key}
                  cx={p.x}
                  cy={p.y}
                  r={bucket === 'hour' && hours <= 24 ? 3 : 2.5}
                  className="viewing-reports-tchart-dot"
                >
                  <title>{`${tooltipLabel(p.key, bucket)}: ${p.sessions} جلسة`}</title>
                </circle>
              ) : null,
            )}

            {points.map((p, i) =>
              i % labelStep === 0 || i === n - 1 ? (
                <text
                  key={`lbl-${p.key}`}
                  x={p.x}
                  y={PAD.top + plotH + 16}
                  textAnchor="middle"
                  className="viewing-reports-vchart-label"
                >
                  {axisLabel(p.key, bucket, hours)}
                </text>
              ) : null,
            )}

            <text
              x={PAD.left - 36}
              y={PAD.top + plotH / 2}
              textAnchor="middle"
              className="viewing-reports-tchart-axis-title"
              transform={`rotate(-90 ${PAD.left - 36} ${PAD.top + plotH / 2})`}
            >
              الجلسات
            </text>
          </svg>
        </div>
      ) : null}
    </section>
  );
}
