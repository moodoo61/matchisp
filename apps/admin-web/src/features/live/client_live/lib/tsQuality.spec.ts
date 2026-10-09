import { describe, expect, it } from 'vitest';
import {
  applyTsVideoTrack,
  mistTsQualitiesToOptions,
  tsMediumQualityIndex,
  tsQualityTrack,
} from './tsQuality';

describe('tsQuality', () => {
  it('يبني ?video=عرضxارتفاع', () => {
    expect(
      applyTsVideoTrack('/bh1.ts?tkn=abc', { width: 854, height: 480 }),
    ).toBe('/bh1.ts?tkn=abc&video=854x480');
  });

  it('يزيل video إن نقص الارتفاع', () => {
    expect(
      applyTsVideoTrack('/bh1.ts?video=854x480&tkn=abc', {
        width: 854,
        height: null,
      }),
    ).toBe('/bh1.ts?tkn=abc');
  });

  it('يختار الفهرس المتوسط', () => {
    expect(tsMediumQualityIndex(0)).toBe(-1);
    expect(tsMediumQualityIndex(1)).toBe(0);
    expect(tsMediumQualityIndex(2)).toBe(0);
    expect(tsMediumQualityIndex(3)).toBe(1);
    expect(tsMediumQualityIndex(5)).toBe(2);
  });

  it('يربط المستوى بالمسار', () => {
    const options = mistTsQualitiesToOptions([
      { width: 1280, height: 720, label: '720p' },
      { width: 854, height: 480, label: '480p' },
      { width: 512, height: 288, label: '288p' },
    ]);
    expect(tsQualityTrack(options, 1)).toEqual({ width: 854, height: 480 });
    expect(tsMediumQualityIndex(options.length)).toBe(1);
  });
});
