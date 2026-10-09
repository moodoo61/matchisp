import { describe, expect, it } from 'vitest';
import {
  mistVideoTrackLabel,
  parseStreamVideoTracks,
} from './mist-stream-tracks';

describe('mist-stream-tracks', () => {
  it('يستخرج مسارات الفيديو من meta.tracks', () => {
    const map = parseStreamVideoTracks(
      {
        sport1: {
          meta: {
            tracks: {
              video_a: { type: 'video', width: 1920, height: 1080 },
              audio_a: { type: 'audio', width: 0 },
              video_b: { type: 'video', width: 1280, height: 720 },
            },
          },
        },
      },
      null,
    );
    expect(map.get('sport1')).toEqual([
      { width: 1920, height: 1080 },
      { width: 1280, height: 720 },
    ]);
  });

  it('يدمج active_streams longform', () => {
    const map = parseStreamVideoTracks(
      {},
      {
        ch1: {
          tracks: {
            v1: { type: 'video', width: 854, height: 480 },
          },
        },
      },
    );
    expect(map.get('ch1')).toEqual([{ width: 854, height: 480 }]);
  });

  it('يستخرج من health في longform', () => {
    const map = parseStreamVideoTracks(
      {},
      {
        '10ch10': {
          health: {
            tracks: ['video_H264_1280x720_25fps_2'],
            video_H264_1280x720_25fps_2: {
              codec: 'H264',
              width: 1280,
              height: 720,
            },
            video_H264_854x480_25fps_1: {
              codec: 'H264',
              width: 854,
              height: 480,
            },
            audio_AAC_2ch_48000hz_0: { codec: 'AAC', rate: 48000 },
          },
        },
      },
    );
    expect(map.get('10ch10')).toEqual([
      { width: 1280, height: 720 },
      { width: 854, height: 480 },
    ]);
  });

  it('يسمّي الجودة من الارتفاع إن وُجد', () => {
    expect(mistVideoTrackLabel({ width: 1920, height: 1080 })).toBe('1080p');
    expect(mistVideoTrackLabel({ width: 800, height: null })).toBe('800');
  });
});
