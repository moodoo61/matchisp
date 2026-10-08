'use client';

import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import { useHlsPlayback } from '../hooks/useHlsPlayback';
import { stripPlaybackToken } from '../lib/playbackUrlIdentity';
import {
  FullscreenIcon,
  MutedIcon,
  PauseIcon,
  PipIcon,
  PlayIcon,
  QualityIcon,
  StopIcon,
  VolumeIcon,
} from './ClientLiveIcons';

type Props = {
  hlsUrl: string;
  /** شعار العلامة يظهر في المنتصف عند الإيقاف */
  brandLogoUrl?: string | null;
  /** تشغيل تلقائي عند التحميل — من إعدادات صفحة المشاهدة */
  autoplay?: boolean;
};

/** مشغّل نظيف — أدوات تشغيل فقط بدون أي نص مكرر */
export function ClientLivePlayer({
  hlsUrl,
  brandLogoUrl,
  autoplay = false,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const qualityMenuRef = useRef<HTMLDivElement | null>(null);
  const streamKey = stripPlaybackToken(hlsUrl);
  const [stopped, setStopped] = useState(!autoplay);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);

  const {
    error,
    ready,
    buffering,
    playing,
    muted,
    volume,
    levels,
    level,
    qualitySelectable,
    progress,
    buffered,
    seekable,
    startPlayback,
    haltPlayback,
    selectQuality,
    setMuted,
    setVolume,
    seekToProgress,
  } = useHlsPlayback(hlsUrl, videoRef, { autoplay });

  useEffect(() => {
    setStopped(!autoplay);
    setQualityOpen(false);
  }, [streamKey, autoplay]);

  // إن بدأ التشغيل فعلياً ألغِ حالة الإيقاف حتى يظهر الفيديو
  useEffect(() => {
    if (playing) setStopped(false);
  }, [playing]);

  useEffect(() => {
    const video = videoRef.current;
    setPipSupported(
      typeof document !== 'undefined' &&
        !!document.pictureInPictureEnabled &&
        !!video &&
        typeof video.requestPictureInPicture === 'function',
    );

    const onEnter = () => setPipActive(true);
    const onLeave = () => setPipActive(false);
    video?.addEventListener('enterpictureinpicture', onEnter);
    video?.addEventListener('leavepictureinpicture', onLeave);
    return () => {
      video?.removeEventListener('enterpictureinpicture', onEnter);
      video?.removeEventListener('leavepictureinpicture', onLeave);
    };
  }, [ready]);

  useEffect(() => {
    if (!qualityOpen) return;
    const onPointer = (event: MouseEvent) => {
      const root = qualityMenuRef.current;
      if (root && !root.contains(event.target as Node)) {
        setQualityOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setQualityOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [qualityOpen]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (stopped || video.paused) {
      setStopped(false);
      startPlayback();
      return;
    }
    video.pause();
  };

  const stopPlayback = () => {
    haltPlayback();
    setStopped(true);
    setQualityOpen(false);
  };

  const toggleMuted = () => {
    if (muted) {
      setMuted(false);
      if (volume === 0) setVolume(0.7);
      return;
    }
    setMuted(true);
  };

  const onVolumeInput = (event: ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(event.target.value));
  };

  const onSeekInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (!seekable || stopped) return;
    seekToProgress(Number(event.target.value));
  };

  const enterFullscreen = () => {
    const root = rootRef.current;
    if (!root) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.requestFullscreen();
  };

  const togglePip = async () => {
    const video = videoRef.current;
    if (!video || !pipSupported) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        if (stopped) {
          setStopped(false);
          startPlayback();
        }
        await video.requestPictureInPicture();
      }
    } catch {
      /* unsupported / denied */
    }
  };

  const currentQualityLabel =
    level < 0
      ? 'تلقائي'
      : levels.find((item) => item.index === level)?.label ?? 'جودة';

  const showPlaying = playing && !stopped;
  const brandLogo = brandLogoUrl?.trim() || null;
  const showVideo = (ready || playing) && !stopped;

  return (
    <div
      ref={rootRef}
      className={[
        'client-live-player',
        showVideo ? 'is-ready' : 'is-loading',
        stopped ? 'is-stopped' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onDoubleClick={enterFullscreen}
      onClick={(event) => {
        // ضغطة على السطح (ليس الأزرار) تشغّل إن كان متوقفاً — إيماءة مستخدم
        if ((event.target as HTMLElement).closest('button, input, .cl-quality-menu')) {
          return;
        }
        if (stopped || (!playing && videoRef.current?.paused)) {
          togglePlayback();
        }
      }}
    >
      <div className="client-live-poster is-blank" aria-hidden />
      <video
        ref={videoRef}
        className="client-live-video"
        playsInline
        autoPlay={autoplay}
        muted={muted}
        aria-label="البث المباشر"
      />

      <div className="cl-player-shade" aria-hidden />

      {stopped && brandLogo ? (
        <div className="cl-player-brand-idle" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandLogo} alt="" />
        </div>
      ) : null}

      {buffering && !error && !stopped ? (
        <div className="client-live-buffer" aria-hidden>
          <span className="client-live-buffer-ring" />
          <span>جارٍ تجهيز البث</span>
        </div>
      ) : null}

      {!stopped ? (
        <div
          className="cl-player-progress"
          dir="ltr"
          style={
            {
              '--cl-progress': `${Math.round(progress * 1000) / 10}%`,
              '--cl-buffered': `${Math.round(buffered * 1000) / 10}%`,
            } as CSSProperties
          }
        >
          <div className="cl-player-progress-track" aria-hidden>
            <span className="cl-player-progress-buffered" />
            <span className="cl-player-progress-played" />
          </div>
          <input
            className="cl-player-progress-input"
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            disabled={!seekable}
            onChange={onSeekInput}
            aria-label="شريط التقدم"
          />
        </div>
      ) : null}

      <div className="cl-player-controls" dir="ltr">
        <div className="cl-player-controls-main">
          <button
            type="button"
            className="cl-player-button is-primary"
            onClick={togglePlayback}
            aria-label={showPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {showPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            className="cl-player-button"
            onClick={stopPlayback}
            aria-label="إيقاف"
            disabled={stopped}
          >
            <StopIcon />
          </button>
          <div className="cl-volume">
            <button
              type="button"
              className="cl-player-button"
              onClick={toggleMuted}
              aria-label={muted || volume === 0 ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {muted || volume === 0 ? <MutedIcon /> : <VolumeIcon />}
            </button>
            <input
              className="cl-volume-slider"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={onVolumeInput}
              aria-label="مستوى الصوت"
            />
          </div>
        </div>

        <div className="cl-player-controls-side">
          <div className="cl-quality" ref={qualityMenuRef}>
            <button
              type="button"
              className={`cl-player-button${qualityOpen ? ' is-active' : ''}`}
              onClick={() => setQualityOpen((open) => !open)}
              aria-label={`جودة البث: ${currentQualityLabel}`}
              aria-expanded={qualityOpen}
              aria-haspopup="menu"
            >
              <QualityIcon />
              <span className="cl-quality-badge">{currentQualityLabel}</span>
            </button>
            {qualityOpen ? (
              <div className="cl-quality-menu" role="menu" aria-label="جودة البث" dir="rtl">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={level < 0}
                  className={level < 0 ? 'is-active' : undefined}
                  onClick={() => {
                    selectQuality(-1);
                    setQualityOpen(false);
                  }}
                >
                  تلقائي
                </button>
                {qualitySelectable ? (
                  levels.map((item) => (
                    <button
                      key={item.index}
                      type="button"
                      role="menuitemradio"
                      aria-checked={level === item.index}
                      className={level === item.index ? 'is-active' : undefined}
                      onClick={() => {
                        selectQuality(item.index);
                        setQualityOpen(false);
                      }}
                    >
                      {item.label}
                    </button>
                  ))
                ) : (
                  <p className="cl-quality-hint">
                    الجودة اليدوية غير متاحة على هذا المتصفح
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {pipSupported ? (
            <button
              type="button"
              className={`cl-player-button${pipActive ? ' is-active' : ''}`}
              onClick={() => void togglePip()}
              aria-label={pipActive ? 'إغلاق صورة داخل صورة' : 'صورة داخل صورة'}
            >
              <PipIcon />
            </button>
          ) : null}

          <button
            type="button"
            className="cl-player-button"
            onClick={enterFullscreen}
            aria-label="ملء الشاشة"
          >
            <FullscreenIcon />
          </button>
        </div>
      </div>

      {error ? <p className="client-live-player-error">{error}</p> : null}
    </div>
  );
}
