import { describe, expect, it } from 'vitest';
import {
  findNearestMatchId,
  formatMatchTime,
  matchDateKey,
} from './matchScheduleUtils';
import type { PublicSportMatch } from '../../types';

function match(
  id: string,
  kickoffAt: string,
): PublicSportMatch {
  return {
    id,
    tournament: 't',
    kickoffAt,
    homeTeam: {
      id: 'h',
      name: 'Home',
      type: 'CLUB',
      logoUrl: null,
    },
    awayTeam: {
      id: 'a',
      name: 'Away',
      type: 'CLUB',
      logoUrl: null,
    },
    channel: null,
  };
}

describe('findNearestMatchId', () => {
  it('picks closest kickoff to now', () => {
    const now = Date.parse('2026-10-14T15:00:00+03:00');
    const id = findNearestMatchId(
      [
        match('early', '2026-10-14T12:00:00+03:00'),
        match('near', '2026-10-14T15:20:00+03:00'),
        match('late', '2026-10-14T21:00:00+03:00'),
      ],
      now,
      'Asia/Baghdad',
    );
    expect(id).toBe('near');
  });

  it('prefers live match inside window over equally distant finished', () => {
    const now = Date.parse('2026-10-14T16:00:00+03:00');
    // جارية منذ ساعة مقابل قادمة بعد ساعة — الجارية أقرب للمنتصف
    const id = findNearestMatchId(
      [
        match('live', '2026-10-14T15:00:00+03:00'),
        match('upcoming', '2026-10-14T17:00:00+03:00'),
      ],
      now,
      'Asia/Baghdad',
    );
    expect(id).toBe('live');
  });
});

describe('schedule timezone display', () => {
  it('formats time in Asia/Baghdad independent of UTC offset in ISO', () => {
    // 18:00 بغداد = 15:00 UTC
    expect(formatMatchTime('2026-10-14T15:00:00.000Z', 'Asia/Baghdad')).toMatch(
      /6:00|18:00/,
    );
    expect(matchDateKey('2026-10-14T22:30:00.000Z', 'Asia/Baghdad')).toBe(
      '2026-10-15',
    );
  });
});
