import { describe, expect, it } from 'vitest';
import {
  buildMistPlaybackUrls,
  isLoopbackHttpBase,
  normalizeMistHttpBase,
  resolveMistPublicHttpBase,
} from './mist-playback-urls';

describe('mist-playback-urls', () => {
  it('يبني روابط HLS و WHEP من اسم القناة', () => {
    expect(buildMistPlaybackUrls('http://live.local:8080/', 'sport1')).toEqual({
      hlsUrl: 'http://live.local:8080/hls/sport1/index.m3u8',
      whepUrl: 'http://live.local:8080/webrtc/sport1',
    });
  });

  it('يكتشف عناوين loopback', () => {
    expect(isLoopbackHttpBase('http://127.0.0.1:8080')).toBe(true);
    expect(isLoopbackHttpBase('http://170.101.111.184')).toBe(false);
  });

  it('يتجاهل loopback ويستنتج من ADMIN_WEB_URL', () => {
    expect(
      resolveMistPublicHttpBase({
        configured: 'http://127.0.0.1:8080',
        adminWebUrl: 'http://170.101.111.184:4010',
      }),
    ).toBe('http://170.101.111.184');
  });

  it('يفضّل العنوان العام المضبوط', () => {
    expect(
      resolveMistPublicHttpBase({
        configured: 'http://mo.zerolag.live',
        adminWebUrl: 'http://170.101.111.184:4010',
      }),
    ).toBe('http://mo.zerolag.live');
  });

  it('normalize فارغ لا يفرض localhost مباشرة', () => {
    expect(normalizeMistHttpBase('')).toBe('');
  });
});
