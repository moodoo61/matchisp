import { describe, expect, it } from 'vitest';
import {
  buildMistPlaybackPaths,
  buildMistPlaybackUrls,
  normalizeMistHttpBase,
} from './mist-playback-urls';

describe('mist-playback-urls', () => {
  it('يبني مسارات نسبية من اسم القناة', () => {
    expect(buildMistPlaybackPaths('sport1')).toEqual({
      hlsUrl: '/hls/sport1/index.m3u8',
      tsUrl: '/sport1.ts',
      whepUrl: '/webrtc/sport1',
      token: null,
    });
  });

  it('بدون قاعدة يُبقي المسارات نسبية', () => {
    expect(buildMistPlaybackUrls('', 'ch1')).toEqual({
      hlsUrl: '/hls/ch1/index.m3u8',
      tsUrl: '/ch1.ts',
      whepUrl: '/webrtc/ch1',
      token: null,
    });
    expect(buildMistPlaybackUrls('auto', 'ch1')).toEqual({
      hlsUrl: '/hls/ch1/index.m3u8',
      tsUrl: '/ch1.ts',
      whepUrl: '/webrtc/ch1',
      token: null,
    });
  });

  it('مع قاعدة صريحة يبني روابط مطلقة (Mist بعيد)', () => {
    expect(buildMistPlaybackUrls('http://mist.example:8080/', 'sport1')).toEqual({
      hlsUrl: 'http://mist.example:8080/hls/sport1/index.m3u8',
      tsUrl: 'http://mist.example:8080/sport1.ts',
      whepUrl: 'http://mist.example:8080/webrtc/sport1',
      token: null,
    });
  });

  it('يرفق tkn عند تمرير توكن', () => {
    expect(buildMistPlaybackUrls('', 'ch1', 'abc.token')).toEqual({
      hlsUrl: '/hls/ch1/index.m3u8?tkn=abc.token',
      tsUrl: '/ch1.ts?tkn=abc.token',
      whepUrl: '/webrtc/ch1?tkn=abc.token',
      token: 'abc.token',
    });
  });

  it('normalize يتجاهل فارغ و auto', () => {
    expect(normalizeMistHttpBase('')).toBe('');
    expect(normalizeMistHttpBase('auto')).toBe('');
    expect(normalizeMistHttpBase('http://a/')).toBe('http://a');
  });
});
