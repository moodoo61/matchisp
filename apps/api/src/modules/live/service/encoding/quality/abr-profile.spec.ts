import { describe, expect, it, afterEach } from 'vitest';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DEFAULT_ENCODING_QUALITY, normalizeEncodingQuality } from '@isp/shared';
import {
  abrProfileKeyFromRungIds,
  resolveAbrProfileForRungs,
  sameRungIdSet,
} from './abr-profile';

const tempDir = path.join(tmpdir(), `abr-profile-${process.pid}`);

describe('abr-profile', () => {
  afterEach(() => {
    delete process.env.LIVE_ABR_PROFILES_DIR;
    delete process.env.LIVE_ABR_SCRIPT_PATH;
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('يعيد السكربت العام عند تطابق الجودات', () => {
    process.env.LIVE_ABR_PROFILES_DIR = tempDir;
    process.env.LIVE_ABR_SCRIPT_PATH = '/opt/match/scripts/live/abr_nvenc.sh';
    const settings = normalizeEncodingQuality({
      rungs: DEFAULT_ENCODING_QUALITY.rungs,
    });
    const globalIds = settings.rungs.filter((r) => r.enabled).map((r) => r.id);
    const resolved = resolveAbrProfileForRungs(settings, globalIds);
    expect(resolved.isGlobal).toBe(true);
    expect(resolved.profileKey).toBeNull();
    expect(resolved.scriptPath).toContain('abr_nvenc.sh');
  });

  it('ينشئ سكربتاً مخصصاً ويعيد استخدامه لنفس البصمة', () => {
    process.env.LIVE_ABR_PROFILES_DIR = tempDir;
    process.env.LIVE_ABR_SCRIPT_PATH = '/opt/match/scripts/live/abr_nvenc.sh';
    const settings = normalizeEncodingQuality({
      rungs: DEFAULT_ENCODING_QUALITY.rungs,
    });
    const without1080 = settings.rungs
      .filter((r) => r.enabled && r.id !== 'p1080')
      .map((r) => r.id);

    const first = resolveAbrProfileForRungs(settings, without1080);
    const second = resolveAbrProfileForRungs(settings, without1080);

    expect(first.isGlobal).toBe(false);
    expect(first.profileKey).toBe(abrProfileKeyFromRungIds(without1080));
    expect(first.scriptPath).toBe(second.scriptPath);
    expect(sameRungIdSet(first.rungIds, second.rungIds)).toBe(true);
  });
});
