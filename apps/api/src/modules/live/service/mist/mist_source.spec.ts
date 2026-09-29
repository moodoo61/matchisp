import { describe, expect, it } from 'vitest';
import { resolveMistSource } from './mist_source';

describe('resolveMistSource (compat → passthrough)', () => {
  it('يمرّر مصدر IPTV دون تغيير', () => {
    expect(
      resolveMistSource({
        type: 'IPTV',
        sourceUrl: 'http://example/stream.m3u8',
      }),
    ).toBe('http://example/stream.m3u8');
  });
});
