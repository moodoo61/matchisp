'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export type HlsQualityLevel = {
  index: number;
  label: string;
};

type PlaybackState = {
  error: string | null;
  ready: boolean;
  buffering: boolean;
  playing: boolean;
  muted: boolean;
  volume: number;
  levels: HlsQualityLevel[];
  level: number;
  /** هل يمكن اختيار جودة ثابتة (hls.js) */
  qualitySelectable: boolean;
  /** موضع التشغيل ضمن نافذة seekable (0..1) */
  progress: number;
  /** الجزء المخزّن مؤقتاً (0..1) */
  buffered: number;
  /** هل يمكن السحب داخل النافذة */
  seekable: boolean;
};

function readTimeline(video: HTMLVideoElement) {
  let start = 0;
  let end = 0;
  let seekable = false;

  if (video.seekable.length > 0) {
    start = video.seekable.start(0);
    end = video.seekable.end(video.seekable.length - 1);
    seekable = Number.isFinite(end) && end > start;
  } else if (Number.isFinite(video.duration) && video.duration > 0) {
    start = 0;
    end = video.duration;
    seekable = true;
  }

  const span = Math.max(end - start, 0.001);
  const current = Math.min(Math.max(video.currentTime, start), end || video.currentTime);
  const progress = seekable ? Math.min(1, Math.max(0, (current - start) / span)) : 0;

  let buffered = 0;
  if (video.buffered.length > 0 && seekable) {
    const bufEnd = video.buffered.end(video.buffered.length - 1);
    buffered = Math.min(1, Math.max(0, (bufEnd - start) / span));
  } else if (!seekable && video.buffered.length > 0) {
    buffered = 1;
  }

  return { progress, buffered, seekable, start, end };
}

function mapLevels(
  levels: Array<{ height?: number; bitrate?: number }>,
): HlsQualityLevel[] {
  const mapped = levels.map((item, index) => ({
    index,
    height: item.height ?? 0,
    bitrate: item.bitrate ?? 0,
    label: item.height
      ? `${item.height}p`
      : `${Math.round((item.bitrate ?? 0) / 1000)}k`,
  }));

  // عرض من الأعلى للأدنى مع الإبقاء على فهرس hls الأصلي
  return [...mapped]
    .sort((a, b) => b.height - a.height || b.bitrate - a.bitrate)
    .map(({ index, label }) => ({ index, label }))
    .filter(
      (item, index, all) =>
        all.findIndex((candidate) => candidate.label === item.label) === index,
    );
}

/** منطق تشغيل HLS فقط — بدون أي عناصر عرض */
export function useHlsPlayback(
  hlsUrl: string,
  videoRef: React.RefObject<HTMLVideoElement | null>,
) {
  const hlsRef = useRef<Hls | null>(null);
  const timelineRef = useRef({ start: 0, end: 0, seekable: false });
  const [state, setState] = useState<PlaybackState>({
    error: null,
    ready: false,
    buffering: true,
    playing: false,
    muted: true,
    volume: 1,
    levels: [],
    level: -1,
    qualitySelectable: false,
    progress: 0,
    buffered: 0,
    seekable: false,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    setState({
      error: null,
      ready: false,
      buffering: true,
      playing: false,
      muted: true,
      volume: 1,
      levels: [],
      level: -1,
      qualitySelectable: false,
      progress: 0,
      buffered: 0,
      seekable: false,
    });

    let hls: Hls | null = null;
    let cancelled = false;

    const patch = (next: Partial<PlaybackState>) =>
      setState((current) => ({ ...current, ...next }));

    const syncTimeline = () => {
      if (cancelled) return;
      const next = readTimeline(video);
      timelineRef.current = {
        start: next.start,
        end: next.end,
        seekable: next.seekable,
      };
      patch({
        progress: next.seekable ? next.progress : Math.max(next.progress, 0.97),
        buffered: next.seekable ? next.buffered : Math.max(next.buffered, 1),
        seekable: next.seekable,
      });
    };

    const markReady = () => {
      if (cancelled) return;
      patch({ ready: true, buffering: false });
      syncTimeline();
    };
    const onWaiting = () => patch({ buffering: true });
    const onPlaying = () => {
      patch({ playing: true });
      markReady();
    };
    const onPause = () => patch({ playing: false });
    const onVolume = () =>
      patch({
        muted: video.muted,
        volume: video.volume,
      });

    // يبدأ مكتوماً للسماح بالتشغيل التلقائي، ثم يُدار عبر الحالة
    video.muted = true;
    video.volume = 1;

    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('volumechange', onVolume);
    video.addEventListener('canplay', markReady);
    video.addEventListener('timeupdate', syncTimeline);
    video.addEventListener('progress', syncTimeline);
    video.addEventListener('durationchange', syncTimeline);

    // نفضّل hls.js دائماً عند الدعم حتى تظهر مستويات الجودة
    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        startLevel: -1,
        autoStartLoad: true,
        backBufferLength: 30,
      });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      const applyLevels = () => {
        if (!hls || cancelled) return;
        patch({
          levels: mapLevels(hls.levels),
          qualitySelectable: hls.levels.length > 0,
          level: hls.autoLevelEnabled ? -1 : hls.currentLevel,
        });
      };

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        applyLevels();
        void video.play().catch(() => undefined);
      });
      hls.on(Hls.Events.LEVELS_UPDATED, applyLevels);
      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        if (!hls || cancelled) return;
        patch({
          level: hls.autoLevelEnabled ? -1 : data.level,
        });
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          patch({ error: 'تعذر تشغيل البث المباشر', buffering: false });
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari/iOS — بدون تحكم يدوي بالجودة
      patch({ qualitySelectable: false, levels: [], level: -1 });
      video.src = hlsUrl;
      void video.play().catch(() => undefined);
    } else {
      patch({ error: 'المتصفح لا يدعم تشغيل HLS', buffering: false });
    }

    return () => {
      cancelled = true;
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('volumechange', onVolume);
      video.removeEventListener('canplay', markReady);
      video.removeEventListener('timeupdate', syncTimeline);
      video.removeEventListener('progress', syncTimeline);
      video.removeEventListener('durationchange', syncTimeline);
      hls?.destroy();
      hlsRef.current = null;
      video.removeAttribute('src');
      video.load();
    };
  }, [hlsUrl, videoRef]);

  const selectQuality = (next: number) => {
    const hls = hlsRef.current;
    setState((current) => ({ ...current, level: next }));
    if (!hls) return;
    // -1 = تلقائي، غير ذلك مستوى ثابت
    hls.currentLevel = next;
    if (next >= 0) {
      hls.loadLevel = next;
      hls.nextLevel = next;
    }
  };

  const setMuted = (next: boolean) => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = next;
    setState((current) => ({ ...current, muted: next }));
  };

  const setVolume = (next: number) => {
    const video = videoRef.current;
    if (!video) return;
    const volume = Math.min(1, Math.max(0, next));
    video.volume = volume;
    if (volume > 0 && video.muted) {
      video.muted = false;
    }
    if (volume === 0) {
      video.muted = true;
    }
    setState((current) => ({
      ...current,
      volume,
      muted: volume === 0 ? true : video.muted,
    }));
  };

  const seekToProgress = (ratio: number) => {
    const video = videoRef.current;
    const { start, end, seekable } = timelineRef.current;
    if (!video || !seekable) return;
    const next = start + Math.min(1, Math.max(0, ratio)) * (end - start);
    try {
      video.currentTime = next;
      setState((current) => ({
        ...current,
        progress: Math.min(1, Math.max(0, ratio)),
      }));
    } catch {
      /* live may reject seek */
    }
  };

  return { ...state, selectQuality, setMuted, setVolume, seekToProgress };
}
