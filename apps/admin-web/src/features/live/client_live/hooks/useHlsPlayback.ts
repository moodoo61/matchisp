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
  levels: HlsQualityLevel[];
  level: number;
};

/** منطق تشغيل HLS فقط — بدون أي عناصر عرض */
export function useHlsPlayback(
  hlsUrl: string,
  videoRef: React.RefObject<HTMLVideoElement | null>,
) {
  const hlsRef = useRef<Hls | null>(null);
  const [state, setState] = useState<PlaybackState>({
    error: null,
    ready: false,
    buffering: true,
    playing: false,
    muted: true,
    levels: [],
    level: -1,
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
      levels: [],
      level: -1,
    });

    let hls: Hls | null = null;
    let cancelled = false;

    const patch = (next: Partial<PlaybackState>) =>
      setState((current) => ({ ...current, ...next }));

    const markReady = () => {
      if (cancelled) return;
      patch({ ready: true, buffering: false });
    };
    const onWaiting = () => patch({ buffering: true });
    const onPlaying = () => {
      patch({ playing: true });
      markReady();
    };
    const onPause = () => patch({ playing: false });
    const onVolume = () => patch({ muted: video.muted });

    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('volumechange', onVolume);
    video.addEventListener('canplay', markReady);

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      void video.play().catch(() => undefined);
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        startLevel: -1,
        backBufferLength: 30,
      });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        const unique = data.levels
          .map((item, index) => ({
            index,
            label: item.height
              ? `${item.height}p`
              : `${Math.round(item.bitrate / 1000)}k`,
          }))
          .filter(
            (item, index, all) =>
              all.findIndex(
                (candidate) => candidate.label === item.label,
              ) === index,
          );
        patch({ levels: unique.reverse() });
        void video.play().catch(() => undefined);
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        if (hls?.autoLevelEnabled) patch({ level: -1 });
        else patch({ level: data.level });
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          patch({ error: 'تعذر تشغيل البث المباشر', buffering: false });
        }
      });
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
      hls?.destroy();
      hlsRef.current = null;
      video.removeAttribute('src');
      video.load();
    };
  }, [hlsUrl, videoRef]);

  const selectQuality = (next: number) => {
    setState((current) => ({ ...current, level: next }));
    if (hlsRef.current) hlsRef.current.currentLevel = next;
  };

  return { ...state, selectQuality };
}
