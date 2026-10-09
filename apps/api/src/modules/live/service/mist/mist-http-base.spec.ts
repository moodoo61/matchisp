import { describe, expect, it } from 'vitest';
import {
  absolutizeMistPlaybackUrl,
  resolveServerMistHttpBase,
} from './mist-http-base';

describe('mist-http-base', () => {
  it('uses explicit http url when set', () => {
    expect(
      resolveServerMistHttpBase(
        'http://mist.example:9090',
        'http://127.0.0.1:4242/api2',
      ),
    ).toBe('http://mist.example:9090');
  });

  it('derives :8080 from api host when auto', () => {
    expect(
      resolveServerMistHttpBase('auto', 'http://127.0.0.1:4242/api2'),
    ).toBe('http://127.0.0.1:8080');
  });

  it('absolutizes relative ts path', () => {
    expect(
      absolutizeMistPlaybackUrl('http://127.0.0.1:8080', '/sport1.ts?tkn=x'),
    ).toBe('http://127.0.0.1:8080/sport1.ts?tkn=x');
  });
});
