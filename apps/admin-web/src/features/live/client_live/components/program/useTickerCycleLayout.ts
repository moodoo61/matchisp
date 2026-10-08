'use client';

import { useLayoutEffect, type RefObject } from 'react';

const SEC_PER_100PX = 3.2;
const GAP_PX = 48;

/** ضبط عرض الدورة ومدة الحركة حسب الشاشة والنص */
export function useTickerCycleLayout(
  viewportRef: RefObject<HTMLElement | null>,
  measureRef: RefObject<HTMLElement | null>,
  trackRef: RefObject<HTMLElement | null>,
  text: string,
) {
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const measure = measureRef.current;
    const track = trackRef.current;
    if (!viewport || !measure || !track || !text) return;

    const layout = () => {
      const contentW = Math.ceil(measure.getBoundingClientRect().width);
      const viewW = viewport.clientWidth;
      if (viewW <= 0 || contentW <= 0) return;

      // دورة ≥ عرض الشاشة حتى لا يظهر فراغ؛ و≥ النص + فجوة للتكرار السلس
      const cycleW = Math.max(contentW + GAP_PX, viewW);
      const durationSec = Math.max(10, (cycleW / 100) * SEC_PER_100PX);

      track.style.setProperty('--cl-ticker-cycle', `${cycleW}px`);
      track.style.setProperty('--cl-ticker-duration', `${durationSec}s`);
    };

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [viewportRef, measureRef, trackRef, text]);
}
