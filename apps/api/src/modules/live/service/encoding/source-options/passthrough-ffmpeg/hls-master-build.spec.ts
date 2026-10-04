import { describe, expect, it } from 'vitest';
import { buildCustomHlsMaster } from './hls-master-build';

describe('buildCustomHlsMaster', () => {
  it('يبني master من مستويين مع روابط مطلقة', () => {
    const body = buildCustomHlsMaster([
      {
        url: 'https://cdn.example/02.m3u8',
        bandwidth: 3_000_000,
        averageBandwidth: null,
        resolution: '1280x720',
        frameRate: null,
        name: null,
        label: '720p',
      },
      {
        url: 'https://cdn.example/01.m3u8',
        bandwidth: 6_000_000,
        averageBandwidth: null,
        resolution: '1920x1080',
        frameRate: null,
        name: null,
        label: '1080p',
      },
    ]);
    expect(body).toContain('#EXTM3U');
    expect(body.indexOf('1920x1080')).toBeLessThan(body.indexOf('1280x720'));
    expect(body).toContain('https://cdn.example/01.m3u8');
    expect(body).toContain('https://cdn.example/02.m3u8');
  });
});
