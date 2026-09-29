import { describe, expect, it } from 'vitest';
import { passthroughSourceOption } from './passthrough.option';

describe('passthroughSourceOption', () => {
  it('يمرّر مصدر IPTV إلى MistServer دون تغيير', () => {
    expect(
      passthroughSourceOption.resolveMistSource({
        type: 'IPTV',
        sourceUrl: 'http://example/stream.m3u8',
      }),
    ).toBe('http://example/stream.m3u8');
  });

  it('يبني مصدر ts-exec لأجهزة HDMI (السلوك الحالي)', () => {
    const source = passthroughSourceOption.resolveMistSource({
      type: 'HDMI',
      videoDevice: '/dev/video0',
      audioDevice: 'hw:0,0',
    });
    expect(source.startsWith('ts-exec:ffmpeg')).toBe(true);
    expect(source).toContain('/dev/video0');
    expect(source).toContain('hw:0,0');
  });
});
