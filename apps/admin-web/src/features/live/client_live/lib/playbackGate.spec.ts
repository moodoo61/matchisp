import { describe, expect, it } from 'vitest';
import { hasPlayableTsQualities, isMistStreamOnline } from './playbackGate';

describe('playbackGate', () => {
  it('detects playable ts qualities', () => {
    expect(hasPlayableTsQualities([])).toBe(false);
    expect(
      hasPlayableTsQualities([{ width: 1280, height: null, label: '720' }]),
    ).toBe(false);
    expect(
      hasPlayableTsQualities([{ width: 1280, height: 720, label: '720p' }]),
    ).toBe(true);
  });

  it('treats online=1 as mist green', () => {
    expect(isMistStreamOnline(1)).toBe(true);
    expect(isMistStreamOnline(2)).toBe(false);
    expect(isMistStreamOnline(0)).toBe(false);
  });
});
