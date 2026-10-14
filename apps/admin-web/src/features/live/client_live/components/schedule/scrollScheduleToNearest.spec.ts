import { describe, expect, it, vi } from 'vitest';
import { scrollScheduleToNearest } from './scrollScheduleToNearest';

describe('scrollScheduleToNearest', () => {
  it('scrolls container so target center aligns with viewport center', () => {
    const scrollTo = vi.fn();
    const container = {
      getBoundingClientRect: () => ({
        top: 100,
        height: 400,
        bottom: 500,
        left: 0,
        right: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
      scrollTop: 0,
      scrollHeight: 2000,
      clientHeight: 400,
      scrollTo,
    } as unknown as HTMLElement;

    const target = {
      getBoundingClientRect: () => ({
        top: 700,
        height: 100,
        bottom: 800,
        left: 0,
        right: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
      offsetHeight: 100,
    } as unknown as HTMLElement;

    const ok = scrollScheduleToNearest(container, target, 'smooth');

    expect(ok).toBe(true);
    // مركز الحاوية عند 300، مركز الهدف عند 750 → delta 450
    expect(scrollTo).toHaveBeenCalledWith({ top: 450, behavior: 'smooth' });
  });

  it('returns false when content does not overflow', () => {
    const container = {
      getBoundingClientRect: () => ({
        top: 0,
        height: 400,
        bottom: 400,
        left: 0,
        right: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
      scrollTop: 0,
      scrollHeight: 400,
      clientHeight: 400,
      scrollTo: vi.fn(),
    } as unknown as HTMLElement;

    const target = {
      getBoundingClientRect: () => ({
        top: 10,
        height: 40,
        bottom: 50,
        left: 0,
        right: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
      offsetHeight: 40,
    } as unknown as HTMLElement;

    expect(scrollScheduleToNearest(container, target, 'smooth')).toBe(false);
  });
});
