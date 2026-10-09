import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveClientPlaybackUrl } from './resolveClientPlaybackUrl';

describe('resolveClientPlaybackUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('keeps absolute mist urls', () => {
    expect(
      resolveClientPlaybackUrl('http://mist.example:8080/hls/ch1/index.m3u8'),
    ).toBe('http://mist.example:8080/hls/ch1/index.m3u8');
  });

  it('uses mist port 8080 on page hostname when auto', () => {
    vi.stubEnv('NEXT_PUBLIC_MISTSERVER_HTTP_URL', 'auto');
    vi.stubGlobal('window', {
      location: {
        protocol: 'http:',
        hostname: '172.18.1.2',
        host: '172.18.1.2:4010',
      },
    });

    expect(resolveClientPlaybackUrl('/hls/ch12/index.m3u8')).toBe(
      'http://172.18.1.2:8080/hls/ch12/index.m3u8',
    );
    expect(resolveClientPlaybackUrl('/ch12.ts')).toBe(
      'http://172.18.1.2:8080/ch12.ts',
    );
  });

  it('uses explicit public mist base', () => {
    vi.stubEnv(
      'NEXT_PUBLIC_MISTSERVER_HTTP_URL',
      'http://172.18.1.2:8080/',
    );
    vi.stubGlobal('window', {
      location: {
        protocol: 'http:',
        hostname: '172.18.1.2',
        host: '172.18.1.2:4010',
      },
    });

    expect(resolveClientPlaybackUrl('hls/ch12/index.m3u8')).toBe(
      'http://172.18.1.2:8080/hls/ch12/index.m3u8',
    );
  });
});
