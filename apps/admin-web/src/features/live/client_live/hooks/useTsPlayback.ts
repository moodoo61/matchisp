'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type Mpegts from 'mpegts.js';
import {
  extractPlaybackToken,
  stripPlaybackToken,
} from '../lib/playbackUrlIdentity';
import { tryHtmlVideoAutoplay } from '../lib/htmlVideoAutoplay';
import {
  applyTsVideoTrack,
  mistTsQualitiesToOptions,
  tsMediumQualityIndex,
  tsQualityTrack,
  type TsQualityFromMist,
} from '../lib/tsQuality';

type PlaybackState = {
  error: string | null;
  ready: boolean;
  buffering: boolean;
  playing: boolean;
  muted: boolean;
  volume: number;
  levels: Array<{ index: number; label: string }>;
  level: number;
  activeLevel: number;
  qualitySelectable: boolean;
  /** TS: مسارات Mist الثابتة — بلا وضع تلقائي */
  qualityAuto: boolean;
  progress: number;
  buffered: number;
  seekable: boolean;
};

type Options = {
  autoplay?: boolean;
  /** جودات من Mist للقناة */
  qualities?: TsQualityFromMist[] | null;
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
  const current = Math.min(
    Math.max(video.currentTime, start),
    end || video.currentTime,
  );
  const progress = seekable
    ? Math.min(1, Math.max(0, (current - start) / span))
    : 0;

  let buffered = 0;
  if (video.buffered.length > 0 && seekable) {
    const bufEnd = video.buffered.end(video.buffered.length - 1);
    buffered = Math.min(1, Math.max(0, (bufEnd - start) / span));
  } else if (!seekable && video.buffered.length > 0) {
    buffered = 1;
  }

  return { progress, buffered, seekable, start, end };
}

/** منطق تشغيل MPEG-TS عبر mpegts.js (تحميل ديناميكي — متصفح فقط) */
export function useTsPlayback(
  tsUrl: string,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: Options = {},
) {
  const autoplay = options.autoplay === true;
  const streamKey = stripPlaybackToken(tsUrl);
  const playerRef = useRef<Mpegts.Player | null>(null);
  const tokenRef = useRef<string | null>(extractPlaybackToken(tsUrl));
  const latestUrlRef = useRef(tsUrl);
  const timelineRef = useRef({ start: 0, end: 0, seekable: false });
  latestUrlRef.current = tsUrl;

  /** بصمة المحتوى فقط — تجاهل مراجع المصفوفة الجديدة من polling الأقسام */
  const qualitiesKey = (options.qualities ?? [])
    .map((row) => {
      const width = Math.round(Number(row.width));
      const height = row.height == null ? 0 : Math.round(Number(row.height));
      return `${width}x${height}`;
    })
    .join('|');

  const qualityOptions = useMemo(
    () => mistTsQualitiesToOptions(options.qualities),
    // qualitiesKey يكفي: نفس المسارات ⇒ لا نعيد حساب الخيارات
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qualitiesKey],
  );
  const qualityOptionsRef = useRef(qualityOptions);
  qualityOptionsRef.current = qualityOptions;

  const qualityLevels = useMemo(
    () => qualityOptions.map(({ index, label }) => ({ index, label })),
    [qualityOptions],
  );
  const qualitySelectable = qualityLevels.length > 0;
  /** الافتراضي = الجودة الوسطى من مسارات Mist (?video=عرضxارتفاع) */
  const initialLevel = tsMediumQualityIndex(qualityLevels.length);
  const [level, setLevel] = useState(initialLevel);

  const [state, setState] = useState<PlaybackState>({
    error: null,
    ready: !autoplay,
    buffering: false,
    playing: false,
    muted: false,
    volume: 1,
    levels: qualityLevels,
    level: initialLevel,
    activeLevel: initialLevel,
    qualitySelectable,
    qualityAuto: false,
    progress: 0,
    buffered: 0,
    seekable: false,
  });

  /** عند تغيّر القناة أو وصول/تغيّر مسارات الجودة → الجودة الوسطى */
  useEffect(() => {
    setLevel(tsMediumQualityIndex(qualityLevels.length));
  }, [streamKey, qualitiesKey, qualityLevels.length]);

  /** حدّث قائمة الجودة في الواجهة دون إعادة إنشاء المشغّل */
  useEffect(() => {
    setState((current) => ({
      ...current,
      levels: qualityLevels,
      qualitySelectable,
      qualityAuto: false,
    }));
  }, [qualityLevels, qualitySelectable]);

  /** حدّث رمز Mist فقط — بدون إعادة تشغيل التيار */
  useEffect(() => {
    tokenRef.current = extractPlaybackToken(tsUrl);
    const mistToken = tokenRef.current;
    if (mistToken && typeof document !== 'undefined') {
      document.cookie = `tkn=${encodeURIComponent(mistToken)}; Path=/; SameSite=Lax`;
    }
  }, [tsUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamKey || typeof window === 'undefined') return;

    const sourceUrl = applyTsVideoTrack(
      latestUrlRef.current,
      tsQualityTrack(qualityOptionsRef.current, level),
    );
    tokenRef.current = extractPlaybackToken(sourceUrl);

    setState((current) => ({
      error: null,
      ready: !autoplay,
      buffering: autoplay,
      playing: false,
      muted: false,
      volume: current.volume,
      levels: qualityLevels,
      level,
      activeLevel: level,
      qualitySelectable,
      qualityAuto: false,
      progress: 0,
      buffered: 0,
      seekable: false,
    }));

    let cancelled = false;
    let coldRecovered = false;
    const startedAt = Date.now();
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

    /** تشغيل بعد جاهزية البيانات — بصوت، بدون فرض الكتم */
    const tryPlay = () => {
      if (cancelled || !autoplay) return;
      tryHtmlVideoAutoplay(video, (next) => {
        if (cancelled) return;
        patch({
          playing: next.playing,
          muted: next.muted,
          buffering: next.buffering,
          ready: true,
        });
      });
    };

    const onWaiting = () => patch({ buffering: true });
    const onPlaying = () => {
      patch({ playing: true, muted: video.muted });
      markReady();
    };
    const onPause = () => patch({ playing: false });
    const onVolume = () =>
      patch({ muted: video.muted, volume: video.volume });

    /** عند وصول بيانات كافية بعد تنشيط IPTV الخامل */
    const onMediaReady = () => {
      markReady();
      if (autoplay && video.paused) tryPlay();
    };

    video.muted = false;
    video.volume = 1;

    const mistToken = tokenRef.current;
    if (mistToken) {
      document.cookie = `tkn=${encodeURIComponent(mistToken)}; Path=/; SameSite=Lax`;
    }

    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('volumechange', onVolume);
    video.addEventListener('canplay', onMediaReady);
    video.addEventListener('loadeddata', onMediaReady);
    video.addEventListener('timeupdate', syncTimeline);
    video.addEventListener('progress', syncTimeline);
    video.addEventListener('durationchange', syncTimeline);

    /** إعادة ربط مرة واحدة بعد تنشيط Mist — يعالج الشاشة السوداء على IPTV الخامل */
    const recoverColdStart = () => {
      if (cancelled || coldRecovered) return;
      const player = playerRef.current;
      if (!player) return;
      coldRecovered = true;
      patch({ buffering: true, ready: true });
      try {
        player.unload();
        player.load();
      } catch {
        /* ignore */
      }
      window.setTimeout(() => {
        if (!cancelled) tryPlay();
      }, 400);
    };

    const watchdog = window.setInterval(() => {
      if (cancelled) {
        window.clearInterval(watchdog);
        return;
      }
      if (!autoplay) return;
      const elapsed = Date.now() - startedAt;
      if (elapsed < 1800 || elapsed > 14_000) return;

      const hasVideo = video.videoWidth > 0 && video.videoHeight > 0;
      if (hasVideo && !video.paused) {
        window.clearInterval(watchdog);
        return;
      }

      // تيار وصل (وقت يتقدم أو جاهز) بلا صورة → إعادة تحميل بعد اكتمال تنشيط Mist
      const looksBlack =
        !hasVideo &&
        (video.currentTime > 0.2 || video.readyState >= 2 || !video.paused);
      if (looksBlack || (video.paused && video.readyState >= 2)) {
        recoverColdStart();
        window.clearInterval(watchdog);
      }
    }, 900);

    void (async () => {
      try {
        const mpegtsMod = await import('mpegts.js');
        const mpegts = mpegtsMod.default;
        if (cancelled) return;

        const featureOk =
          mpegts.isSupported() && mpegts.getFeatureList().mseLivePlayback;

        if (featureOk) {
          const player = mpegts.createPlayer(
            {
              // HTTP MPEG-TS — ليس WebSocket/mse
              type: 'mpegts',
              isLive: true,
              hasAudio: true,
              hasVideo: true,
              url: sourceUrl,
            },
            {
              enableWorker: true,
              lazyLoad: false,
              liveBufferLatencyChasing: true,
              liveSync: true,
            },
          );
          if (cancelled) {
            player.destroy();
            return;
          }
          playerRef.current = player;
          player.attachMediaElement(video);
          player.on(mpegts.Events.ERROR, () => {
            if (!cancelled) {
              patch({ error: 'تعذر تشغيل بث TS', buffering: false });
            }
          });
          // MEDIA_INFO يصل بعد أن يعلن Mist المسارات — أنسب من play() الفوري على قناة خاملة
          player.on(mpegts.Events.MEDIA_INFO, () => {
            if (!cancelled && autoplay) tryPlay();
          });
          player.load();
          if (!autoplay) {
            video.pause();
            patch({ playing: false, buffering: false, ready: true });
          } else {
            // محاولة متأخرة إن تأخر MEDIA_INFO بعد بدء سحب المصدر
            window.setTimeout(() => {
              if (!cancelled && autoplay && video.paused) tryPlay();
            }, 2500);
          }
          return;
        }

        video.src = sourceUrl;
        if (autoplay) tryPlay();
        else {
          video.pause();
          patch({ playing: false, buffering: false, ready: true });
        }
      } catch {
        if (!cancelled) {
          patch({
            error: 'المتصفح لا يدعم تشغيل TS',
            buffering: false,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      window.clearInterval(watchdog);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('volumechange', onVolume);
      video.removeEventListener('canplay', onMediaReady);
      video.removeEventListener('loadeddata', onMediaReady);
      video.removeEventListener('timeupdate', syncTimeline);
      video.removeEventListener('progress', syncTimeline);
      video.removeEventListener('durationchange', syncTimeline);
      const player = playerRef.current;
      playerRef.current = null;
      if (player) {
        try {
          player.pause();
          player.unload();
          player.detachMediaElement();
          player.destroy();
        } catch {
          /* ignore */
        }
      }
      video.removeAttribute('src');
      video.load();
    };
    // لا تُعد إنشاء المشغّل عند وصول قائمة الجودات — فقط عند تغيّر التيار/المستوى
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamKey, level, videoRef, autoplay]);

  const startPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    const player = playerRef.current;
    setState((current) => ({
      ...current,
      muted: false,
      buffering: true,
      error: null,
    }));
    video.muted = false;
    try {
      player?.play();
    } catch {
      /* ignore */
    }
    void video.play().then(
      () => {
        setState((current) => ({
          ...current,
          playing: true,
          ready: true,
          buffering: false,
          muted: false,
        }));
      },
      () => {
        setState((current) => ({
          ...current,
          playing: false,
          ready: true,
          buffering: false,
        }));
      },
    );
  };

  const haltPlayback = () => {
    const video = videoRef.current;
    const player = playerRef.current;
    if (video) {
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        /* live may reject seek */
      }
    }
    try {
      player?.pause();
    } catch {
      /* ignore */
    }
    setState((current) => ({
      ...current,
      playing: false,
      buffering: false,
      ready: true,
    }));
  };

  const selectQuality = (next: number) => {
    if (next < 0) return;
    setLevel(next);
    setState((current) => ({
      ...current,
      level: next,
      activeLevel: next,
      qualityAuto: false,
    }));
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
    if (volume > 0 && video.muted) video.muted = false;
    if (volume === 0) video.muted = true;
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

  return {
    ...state,
    startPlayback,
    haltPlayback,
    selectQuality,
    setMuted,
    setVolume,
    seekToProgress,
  };
}
