import { describe, expect, it } from 'vitest';
import { encodeGpuSourceOption } from './encode-gpu.option';

describe('encodeGpuSourceOption', () => {
  it('يبني ts-exec بمسار السكربت الكامل وليس $abr', () => {
    const source = encodeGpuSourceOption.resolveMistSource({
      type: 'IPTV',
      sourceUrl: 'http://live.example/stream.m3u8',
    });
    expect(source.startsWith('ts-exec:')).toBe(true);
    expect(source).not.toContain('$abr');
    expect(source).toContain('abr_nvenc.sh');
    expect(source).toContain('http://live.example/stream.m3u8');
  });

  it('يرفض HDMI حالياً', () => {
    expect(() =>
      encodeGpuSourceOption.resolveMistSource({
        type: 'HDMI',
        videoDevice: '/dev/video0',
        audioDevice: 'hw:0,0',
      }),
    ).toThrow(/IPTV/);
  });
});
