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

  it('يبني ts-exec لـ HDMI مع --hdmi وأجهزة الفيديو/الصوت', () => {
    const source = encodeGpuSourceOption.resolveMistSource({
      type: 'HDMI',
      videoDevice: '/dev/video0',
      audioDevice: 'hw:1,0',
    });
    expect(source.startsWith('ts-exec:')).toBe(true);
    expect(source).toContain('abr_nvenc.sh');
    expect(source).toContain('--hdmi');
    expect(source).toContain('/dev/video0');
    expect(source).toContain('hw:1,0');
    expect(source).not.toContain("'hw:1,0'");
  });

  it('يرفض HDMI بلا أجهزة', () => {
    expect(() =>
      encodeGpuSourceOption.resolveMistSource({
        type: 'HDMI',
        videoDevice: '/dev/video0',
        audioDevice: null,
      }),
    ).toThrow(/الصوت|HDMI/);
  });
});
