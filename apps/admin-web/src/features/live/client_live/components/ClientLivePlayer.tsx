'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type RefObject,
} from 'react';
import { useHlsPlayback } from '../hooks/useHlsPlayback';
import { useTsPlayback } from '../hooks/useTsPlayback';
import type { ViewingPlayerId } from '../lib/players';
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
  mode: ViewingPlayerId;
  srcUrl: string;
  brandLogoUrl?: string | null;
  autoplay?: boolean;
  /** جودات TS من Mist */
  tsQualities?: Array<{ width: number; height: number | null; label: string }>;
  /** يُستدعى مرة عند فشل التشغيل — لتبديل المشغّل الاحتياطي */
  onPlaybackError?: () => void;
};

type PlaybackApi = {
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
  qualityAuto: boolean;
  progress: number;
  buffered: number;
  seekable: boolean;
  startPlayback: () => void;
  haltPlayback: () => void;
  selectQuality: (next: number) => void;
  setMuted: (next: boolean) => void;
  setVolume: (next: number) => void;
  seekToProgress: (ratio: number) => void;
};

/** مشغّل نظيف — HLS أو TS حسب الوضع */
export function ClientLivePlayer(props: Props) {
  if (props.mode === 'ts') {
    return <TsPlayerBody {...props} />;
  }
  return <HlsPlayerBody {...props} />;
}

function HlsPlayerBody({
  srcUrl,
  brandLogoUrl,
  autoplay = false,
  onPlaybackError,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playback = useHlsPlayback(srcUrl, videoRef, { autoplay });
  return (
    <PlayerChrome
      srcUrl={srcUrl}
      brandLogoUrl={brandLogoUrl}
      autoplay={autoplay}
      videoRef={videoRef}
      playback={playback}
      onPlaybackError={onPlaybackError}
    />
  );
}

function TsPlayerBody({
  srcUrl,
  brandLogoUrl,
  autoplay = false,
  tsQualities,
  onPlaybackError,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playback = useTsPlayback(srcUrl, videoRef, {
    autoplay,
    qualities: tsQualities,
  });
  return (
    <PlayerChrome
      srcUrl={srcUrl}
      brandLogoUrl={brandLogoUrl}
      autoplay={autoplay}
      videoRef={videoRef}
      playback={playback}
      onPlaybackError={onPlaybackError}
    />
  );
}

function PlayerChrome({
  srcUrl,
  brandLogoUrl,
  autoplay = false,
  videoRef,
  playback,
  onPlaybackError,
}: {
  srcUrl: string;
  brandLogoUrl?: string | null;
  autoplay?: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  playback: PlaybackApi;
  onPlaybackError?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const qualityMenuRef = useRef<HTMLDivElement | null>(null);
  const streamKey = stripPlaybackToken(srcUrl);
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
    activeLevel,
    qualitySelectable,
    qualityAuto,
    progress,
    buffered,
    seekable,
    startPlayback,
    haltPlayback,
    selectQuality,
    setMuted,
    setVolume,
    seekToProgress,
  } = playback;

  useEffect(() => {
    setStopped(!autoplay);
    setQualityOpen(false);
  }, [streamKey, autoplay]);

  useEffect(() => {
    if (playing) setStopped(false);
  }, [playing]);

  const errorNotifiedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!error || !onPlaybackError) return;
    if (errorNotifiedRef.current === error) return;
    errorNotifiedRef.current = error;
    onPlaybackError();
  }, [error, onPlaybackError]);

  useEffect(() => {
    errorNotifiedRef.current = null;
  }, [streamKey]);

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
  }, [ready, videoRef]);

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

  const selectedLevelLabel =
    levels.find((item) => item.index === level)?.label ?? null;
  const activeLevelLabel =
    levels.find((item) => item.index === activeLevel)?.label ?? null;
  const currentQualityLabel =
    level < 0
      ? activeLevelLabel
        ? `تلقائي · ${activeLevelLabel}`
        : 'تلقائي'
      : selectedLevelLabel ?? activeLevelLabel ?? 'جودة';

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
        if (
          (event.target as HTMLElement).closest(
            'button, input, .cl-quality-menu',
          )
        ) {
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
              className={`cl-player-button cl-quality-btn${qualityOpen ? ' is-active' : ''}`}
              onClick={() => setQualityOpen((open) => !open)}
              aria-label={`جودة البث: ${currentQualityLabel}`}
              aria-expanded={qualityOpen}
              aria-haspopup="menu"
            >
              <QualityIcon />
              <span className="cl-quality-badge">{currentQualityLabel}</span>
            </button>
            {qualityOpen ? (
              <div
                className="cl-quality-menu"
                role="menu"
                aria-label="جودة البث"
                dir="rtl"
              >
                {qualityAuto ? (
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
                    {level < 0 && activeLevelLabel ? (
                      <span className="cl-quality-now">
                        الآن {activeLevelLabel}
                      </span>
                    ) : null}
                  </button>
                ) : null}
                {qualitySelectable ? (
                  levels.map((item) => {
                    const selected = level === item.index;
                    const playingNow =
                      level < 0 && activeLevel === item.index;
                    return (
                      <button
                        key={item.index}
                        type="button"
                        role="menuitemradio"
                        aria-checked={selected}
                        className={
                          selected
                            ? 'is-active'
                            : playingNow
                              ? 'is-playing'
                              : undefined
                        }
                        onClick={() => {
                          selectQuality(item.index);
                          setQualityOpen(false);
                        }}
                      >
                        {item.label}
                        {playingNow ? (
                          <span className="cl-quality-now">يُعرض</span>
                        ) : null}
                      </button>
                    );
                  })
                ) : (
                  <p className="cl-quality-hint">
                    لا تتوفر مستويات جودة من السيرفر حالياً
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
              aria-label={
                pipActive ? 'إغلاق صورة داخل صورة' : 'صورة داخل صورة'
              }
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
