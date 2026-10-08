'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getViewingReportsSummary } from '@/features/live/viewing_reports/api';
import { hoursFromSec } from '@/features/live/viewing_reports/lib/format';
import type { ViewingReportsSummary } from '@/features/live/viewing_reports/types';

const CHART_W = 640;
const CHART_H = 248;
const PAD = { top: 22, right: 12, bottom: 54, left: 48 };

type Props = { hours: number };

/** أعمدة رأسية: ساعات المشاهدة لكل قناة */
export function ViewingReportsChannelsChart({ hours }: Props) {
  const [summary, setSummary] = useState<ViewingReportsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async (periodHours: number) => {
    setLoading(true);
    try {
      const next = await getViewingReportsSummary(periodHours);
      setSummary(next);
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

  const bars = useMemo(() => {
    const rows = (summary?.byStream ?? []).slice(0, 12);
    return rows.map((r) => ({
      key: r.streamName,
      label: r.channelLabel || r.streamName,
      hours: hoursFromSec(r.durationSec),
    }));
  }, [summary]);

  const maxH = Math.max(1, ...bars.map((b) => b.hours));
  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const gap = 10;
  const barW =
    bars.length > 0 ? Math.max(18, (plotW - gap * (bars.length - 1)) / bars.length) : 0;

  return (
    <section className="viewing-reports-chart-section" aria-labelledby="vr-channels-title">
      {error ? <p className="error">{error}</p> : null}
      {loading && !summary ? <p className="muted">جاري التحميل…</p> : null}
      {!loading && !bars.length ? (
        <p className="muted">لا بيانات مشاهدة في هذه الفترة</p>
      ) : null}

      {bars.length ? (
        <div className="viewing-reports-vchart-wrap">
          <svg
            className="viewing-reports-vchart"
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            role="img"
            aria-label="ساعات المشاهدة"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const y = PAD.top + plotH * (1 - t);
              const val = Math.round(maxH * t * 10) / 10;
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

            {bars.map((bar, i) => {
              const h = (bar.hours / maxH) * plotH;
              const x = PAD.left + i * (barW + gap);
              const y = PAD.top + plotH - h;
              const label =
                bar.label.length > 10 ? `${bar.label.slice(0, 9)}…` : bar.label;
              const labelY = PAD.top + plotH + 14;
              return (
                <g key={bar.key}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(h, 2)}
                    rx={6}
                    className="viewing-reports-vchart-bar"
                  >
                    <title>{`${bar.label}: ${bar.hours} ساعة`}</title>
                  </rect>
                  <text
                    x={x + barW / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className="viewing-reports-vchart-val"
                  >
                    {bar.hours}
                  </text>
                  <text
                    x={x + barW / 2}
                    y={labelY}
                    textAnchor="middle"
                    className="viewing-reports-vchart-label"
                    transform={`rotate(-28 ${x + barW / 2} ${labelY})`}
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            <text
              x={PAD.left - 36}
              y={PAD.top + plotH / 2}
              textAnchor="middle"
              className="viewing-reports-tchart-axis-title"
              transform={`rotate(-90 ${PAD.left - 36} ${PAD.top + plotH / 2})`}
            >
              الساعات
            </text>
          </svg>
        </div>
      ) : null}
    </section>
  );
}
