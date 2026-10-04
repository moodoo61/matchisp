import { describe, expect, it } from 'vitest';
import {
  parseHlsMasterPlaylist,
  resolvePlaylistUri,
} from './hls-master-parse';

const SAMPLE = `#EXTM3U
#EXT-X-VERSION:6
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-STREAM-INF:BANDWIDTH=6324320,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
01.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=3120800,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"
02.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=428640,RESOLUTION=426x240,CODECS="avc1.640015,mp4a.40.2"
06.m3u8
`;

describe('hls-master-parse', () => {
  it('يستخرج مستويات الجودة ويرتّبها من الأعلى', () => {
    const result = parseHlsMasterPlaylist(
      'https://example.com/AJA/index.m3u8',
      SAMPLE,
    );
    expect(result.isMaster).toBe(true);
    expect(result.variants).toHaveLength(3);
    expect(result.variants[0]?.resolution).toBe('1920x1080');
    expect(result.variants[0]?.url).toBe('https://example.com/AJA/01.m3u8');
    expect(result.variants[1]?.url).toBe('https://example.com/AJA/02.m3u8');
    expect(result.variants[0]?.label).toContain('1920×1080');
  });

  it('يعيد جودة واحدة لملف وسائط بلا STREAM-INF', () => {
    const result = parseHlsMasterPlaylist(
      'https://example.com/01.m3u8',
      '#EXTM3U\n#EXTINF:4,\nseg.ts\n',
    );
    expect(result.isMaster).toBe(false);
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0]?.url).toBe('https://example.com/01.m3u8');
  });

  it('يحل المسارات النسبية', () => {
    expect(
      resolvePlaylistUri('https://cdn.example/live/index.m3u8', 'a/b.m3u8'),
    ).toBe('https://cdn.example/live/a/b.m3u8');
  });
});
