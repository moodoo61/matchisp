import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_ENCODING_QUALITY,
  normalizeEncodingQuality,
} from '@isp/shared';
import { writeAbrRuntimeConfig } from './abr-runtime-config';

const tempDir = path.join(tmpdir(), `abr-config-test-${process.pid}`);

describe('writeAbrRuntimeConfig', () => {
  afterEach(() => {
    delete process.env.LIVE_ABR_CONFIG_PATH;
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('يكتب الجودات المفعّلة فقط إلى ملف الترميز', () => {
    mkdirSync(tempDir, { recursive: true });
    const configPath = path.join(tempDir, 'abr_nvenc.json');
    process.env.LIVE_ABR_CONFIG_PATH = configPath;

    const settings = normalizeEncodingQuality({
      rungs: DEFAULT_ENCODING_QUALITY.rungs.map((rung) => ({
        ...rung,
        enabled: rung.id !== 'p720' && rung.id !== 'p288',
      })),
    });

    writeAbrRuntimeConfig(settings);

    const written = JSON.parse(readFileSync(configPath, 'utf8')) as {
      rungs: Array<{ id: string; enabled: boolean }>;
    };

    expect(written.rungs.map((r) => r.id)).toEqual([
      'p1080',
      'p480',
      'p144',
    ]);
    expect(written.rungs.every((r) => r.enabled)).toBe(true);
    expect(written.rungs.some((r) => r.id === 'p720')).toBe(false);
  });

  it('يشمل 1080 و144 في السلم الافتراضي', () => {
    const ids = DEFAULT_ENCODING_QUALITY.rungs.map((r) => r.id);
    expect(ids).toContain('p1080');
    expect(ids).toContain('p144');
    expect(ids[0]).toBe('p1080');
    expect(ids.at(-1)).toBe('p144');
  });
});
