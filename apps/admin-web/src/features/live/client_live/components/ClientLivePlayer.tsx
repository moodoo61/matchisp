'use client';

import { useRef } from 'react';
import { useHlsPlayback } from '../hooks/useHlsPlayback';
import {
  FullscreenIcon,
  MutedIcon,
  PauseIcon,
  PlayIcon,
  VolumeIcon,
} from './ClientLiveIcons';

type Props = {
  hlsUrl: string;
  posterUrl?: string | null;
};

/** مشغّل نظيف — أدوات تشغيل فقط بدون أي نص مكرر */
export function ClientLivePlayer({ hlsUrl, posterUrl }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { error, ready, buffering, playing, muted, levels, level, selectQuality } =
    useHlsPlayback(hlsUrl, videoRef);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  };

  const toggleMuted = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const enterFullscreen = () => {
    const root = rootRef.current;
    if (!root) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.requestFullscreen();
  };

  return (
    <div
      ref={rootRef}
      className={
        ready ? 'client-live-player is-ready' : 'client-live-player is-loading'
      }
      onDoubleClick={enterFullscreen}
    >
      {posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="client-live-poster" src={posterUrl} alt="" aria-hidden />
      ) : (
        <div className="client-live-poster is-blank" aria-hidden />
      )}
      <video
        ref={videoRef}
        className="client-live-video"
        playsInline
        autoPlay
        muted
        poster={posterUrl ?? undefined}
        aria-label="البث المباشر"
        onClick={togglePlayback}
      />

      <div className="cl-player-shade" aria-hidden />

      {buffering && !error ? (
        <div className="client-live-buffer" aria-hidden>
          <span className="client-live-buffer-ring" />
          <span>جارٍ تجهيز البث</span>
        </div>
      ) : null}

      <div className="cl-player-controls">
        <div className="cl-player-controls-main">
          <button
            type="button"
            className="cl-player-button is-primary"
            onClick={togglePlayback}
            aria-label={playing ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            className="cl-player-button"
            onClick={toggleMuted}
            aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {muted ? <MutedIcon /> : <VolumeIcon />}
          </button>
        </div>

        <div className="cl-player-controls-side">
          {levels.length ? (
            <label className="cl-quality">
              <span className="sr-only">جودة البث</span>
              <select
                value={level}
                onChange={(event) => selectQuality(Number(event.target.value))}
                aria-label="جودة البث"
              >
                <option value={-1}>تلقائي</option>
                {levels.map((item) => (
                  <option key={item.index} value={item.index}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
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
