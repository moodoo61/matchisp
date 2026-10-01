import { describe, expect, it } from 'vitest';
import {
  isNonCaptureAlsaCard,
  pairVideoAudioPaths,
  pickCaptureAlsaCards,
} from './hdmi-audio-pairing';

describe('hdmi-audio-pairing', () => {
  const cards = [
    { index: 0, name: 'HDA NVidia' },
    { index: 1, name: 'HAudio1' },
    { index: 2, name: 'HAudio2' },
    { index: 3, name: 'HAudio3' },
    { index: 4, name: 'HAudio4' },
  ];

  it('يستبعد كرت NVIDIA من الالتقاط', () => {
    expect(isNonCaptureAlsaCard('HDA NVidia')).toBe(true);
    expect(isNonCaptureAlsaCard('HAudio1')).toBe(false);
  });

  it('يفضّل بطاقات HAudio مرتبة', () => {
    const picked = pickCaptureAlsaCards(cards);
    expect(picked.map((c) => c.index)).toEqual([1, 2, 3, 4]);
  });

  it('يربط video0→hw:1,0 و video1→hw:2,0 …', () => {
    const paired = pairVideoAudioPaths(
      ['/dev/video0', '/dev/video1', '/dev/video2', '/dev/video3'],
      cards,
    );
    expect(paired.map((p) => p.audioPath)).toEqual([
      'hw:1,0',
      'hw:2,0',
      'hw:3,0',
      'hw:4,0',
    ]);
  });
});
