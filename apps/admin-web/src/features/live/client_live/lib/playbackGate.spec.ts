import { describe, expect, it } from 'vitest';
import {
  CHANNEL_QUALITIES_GRACE_MS,
  hasPlayableTsQualities,
  isMistStreamOnline,
  planAfterWakeSample,
  planInitialPlayback,
} from './playbackGate';

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

  it('plans immediate ts when green with qualities', () => {
    const plan = planInitialPlayback({
      preferredPlayer: 'ts',
      online: 1,
      tsQualities: [{ width: 1280, height: 720, label: '720p' }],
    });
    expect(plan.phase).toBe('ready');
    expect(plan.needsWake).toBe(false);
    expect(plan.player).toBe('ts');
  });

  it('plans wake when inactive — never switches to hls', () => {
    const plan = planInitialPlayback({
      preferredPlayer: 'ts',
      online: 2,
      tsQualities: [],
    });
    expect(plan.phase).toBe('waking');
    expect(plan.player).toBe('ts');
  });

  it('after green waits for qualities then allows main url', () => {
    const waiting = planAfterWakeSample({
      online: 1,
      streamOnline: true,
      tsQualities: [],
      onlineForMs: 500,
      timedOut: false,
    });
    expect(waiting.phase).toBe('waking');
    expect(waiting.message).toMatch(/جودة/);

    const main = planAfterWakeSample({
      online: 1,
      streamOnline: true,
      tsQualities: [],
      onlineForMs: CHANNEL_QUALITIES_GRACE_MS,
      timedOut: false,
    });
    expect(main.phase).toBe('ready');
    expect(main.player).toBe('ts');
    expect(main.useMainTsUrl).toBe(true);
  });

  it('on timeout while inactive fails without hls fallback', () => {
    const plan = planAfterWakeSample({
      online: 2,
      streamOnline: false,
      tsQualities: [],
      onlineForMs: 0,
      timedOut: true,
    });
    expect(plan.phase).toBe('failed');
    expect(plan.player).toBe('ts');
  });
});
