import { describe, expect, it } from 'vitest';
import {
  hasPlayableTsQualities,
  isChannelStreamLive,
  planAfterWakeAttempt,
  planInitialPlayback,
} from './playbackGate';

describe('playbackGate', () => {
  it('detects playable ts qualities', () => {
    expect(hasPlayableTsQualities([])).toBe(false);
    expect(hasPlayableTsQualities([{ width: 1280, height: null, label: '720' }])).toBe(
      false,
    );
    expect(
      hasPlayableTsQualities([{ width: 1280, height: 720, label: '720p' }]),
    ).toBe(true);
  });

  it('plans immediate ts when live with qualities', () => {
    const plan = planInitialPlayback({
      preferredPlayer: 'ts',
      online: 1,
      active: true,
      tsQualities: [{ width: 1280, height: 720, label: '720p' }],
      canFallbackToHls: true,
    });
    expect(plan.phase).toBe('ready');
    expect(plan.needsWake).toBe(false);
    expect(plan.player).toBe('ts');
  });

  it('plans wake when channel inactive', () => {
    const plan = planInitialPlayback({
      preferredPlayer: 'ts',
      online: 2,
      active: false,
      tsQualities: [],
      canFallbackToHls: true,
    });
    expect(plan.phase).toBe('waking');
    expect(plan.needsWake).toBe(true);
  });

  it('after wake uses main ts when live without qualities', () => {
    const plan = planAfterWakeAttempt({
      online: 1,
      active: true,
      tsQualities: [],
      canFallbackToHls: true,
      timedOut: true,
    });
    expect(plan.phase).toBe('ready');
    expect(plan.player).toBe('ts');
    expect(plan.useMainTsUrl).toBe(true);
  });

  it('after wake falls back to hls when still inactive', () => {
    const plan = planAfterWakeAttempt({
      online: 2,
      active: false,
      tsQualities: [],
      canFallbackToHls: true,
      timedOut: true,
    });
    expect(plan.phase).toBe('ready');
    expect(plan.player).toBe('hls');
  });

  it('isChannelStreamLive requires online=1 and active', () => {
    expect(isChannelStreamLive({ online: 1, active: true })).toBe(true);
    expect(isChannelStreamLive({ online: 1, active: false })).toBe(false);
    expect(isChannelStreamLive({ online: 2, active: true })).toBe(false);
  });
});
