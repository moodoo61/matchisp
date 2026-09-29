import { describe, expect, it } from 'vitest';
import { parseActiveStreamStats } from './mist-active-stats';

describe('parseActiveStreamStats', () => {
  it('parses array field responses from MistServer', () => {
    const map = parseActiveStreamStats({
      ch1: [3, 5, 1, 0],
      ch2: [0, 1, 1, 0],
    });
    expect(map.get('ch1')).toEqual({
      name: 'ch1',
      viewers: 3,
      clients: 5,
      inputs: 1,
      outputs: 0,
    });
    expect(map.get('ch2')?.viewers).toBe(0);
  });
});
