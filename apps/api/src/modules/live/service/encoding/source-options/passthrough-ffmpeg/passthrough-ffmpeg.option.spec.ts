import { describe, expect, it } from 'vitest';
import { passthroughFfmpegSourceOption } from './passthrough-ffmpeg.option';

describe('passthroughFfmpegSourceOption', () => {
  it('يبني ts-exec بمسار سكربت التمرير عبر ffmpeg', () => {
    const source = passthroughFfmpegSourceOption.resolveMistSource({
      type: 'IPTV',
      sourceUrl: 'http://live.example/stream.ts',
    });
    expect(source.startsWith('ts-exec:')).toBe(true);
    expect(source).toContain('ffpass.sh');
    expect(source).toContain('http://live.example/stream.ts');
    expect(source).not.toContain('$abr');
  });

  it('يبني أمر ffmpeg لأجهزة HDMI', () => {
    const source = passthroughFfmpegSourceOption.resolveMistSource({
      type: 'HDMI',
      videoDevice: '/dev/video0',
      audioDevice: 'hw:0,0',
    });
    expect(source.startsWith('ts-exec:ffmpeg')).toBe(true);
    expect(source).toContain('-c:v copy');
  });
});
