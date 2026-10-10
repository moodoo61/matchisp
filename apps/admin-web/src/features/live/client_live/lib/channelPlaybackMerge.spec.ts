import { describe, expect, it } from 'vitest';
import {
  isPlaybackReadyForChannel,
  mergeChannelPlayback,
  sameTsStream,
} from './channelPlaybackMerge';

describe('channelPlaybackMerge', () => {
  it('sameTsStream ignores token', () => {
    expect(
      sameTsStream('/ch1.ts?tkn=aaa', 'http://x:8080/ch1.ts?tkn=bbb'),
    ).toBe(true);
    expect(sameTsStream('/ch1.ts', '/ch2.ts')).toBe(false);
  });

  it('does not keep other channel qualities when incoming empty', () => {
    const merged = mergeChannelPlayback(
      {
        hlsUrl: '/hls/ch1/index.m3u8',
        tsUrl: '/ch1.ts',
        whepUrl: '',
        tsQualities: [{ width: 1280, height: 720, label: '720p' }],
      },
      {
        hlsUrl: '/hls/ch2/index.m3u8',
        tsUrl: '/ch2.ts',
        whepUrl: '',
        tsQualities: [],
      },
    );
    expect(merged.tsUrl).toBe('/ch2.ts');
    expect(merged.tsQualities).toEqual([]);
  });

  it('keeps qualities only for same stream when poll returns empty briefly', () => {
    const merged = mergeChannelPlayback(
      {
        hlsUrl: '/hls/ch2/index.m3u8',
        tsUrl: '/ch2.ts?tkn=1',
        whepUrl: '',
        tsQualities: [{ width: 960, height: 540, label: '540p' }],
      },
      {
        hlsUrl: '/hls/ch2/index.m3u8',
        tsUrl: '/ch2.ts?tkn=2',
        whepUrl: '',
        tsQualities: [],
      },
    );
    expect(merged.tsQualities).toEqual([
      { width: 960, height: 540, label: '540p' },
    ]);
  });

  it('rejects ready sample for another channel', () => {
    expect(
      isPlaybackReadyForChannel(
        { id: 'a', name: 'ch1' },
        'b',
        'ch2',
      ),
    ).toBe(false);
    expect(
      isPlaybackReadyForChannel(
        { id: 'b', name: 'ch2' },
        'b',
        'ch2',
      ),
    ).toBe(true);
  });
});
