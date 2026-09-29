import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import {
  enabledEncodingRungs,
  type EncodingQualitySettings,
} from '@isp/shared';
import {
  resolveAbrConfigPath,
  resolveAbrScriptPath,
} from './abr-runtime-config';

export type AbrProfileResolution = {
  /** null = السكربت العام */
  profileKey: string | null;
  scriptPath: string;
  configPath: string;
  isGlobal: boolean;
  rungIds: string[];
};

function monorepoRoot() {
  return path.resolve(__dirname, '../../../../../../../..');
}

export function resolveAbrProfilesDir() {
  return (
    process.env.LIVE_ABR_PROFILES_DIR?.trim() ||
    path.join(monorepoRoot(), 'var/live/abr/profiles')
  );
}

/** بصمة الجودات المفعّلة — نفس المجموعة = نفس السكربت */
export function abrProfileKeyFromRungIds(rungIds: string[]) {
  const normalized = [
    ...new Set(rungIds.map((id) => id.trim()).filter(Boolean)),
  ]
    .sort()
    .join('-');
  if (!normalized) return 'empty';
  if (normalized.length <= 80) return normalized;
  return createHash('sha1').update(normalized).digest('hex').slice(0, 16);
}

export function sameRungIdSet(a: string[], b: string[]) {
  const left = [...new Set(a)].sort();
  const right = [...new Set(b)].sort();
  if (left.length !== right.length) return false;
  return left.every((id, index) => id === right[index]);
}

/**
 * يجهّز سكربت ABR للقناة:
 * - إن طابقت الجودات السكربت العام → المسار العام
 * - وإلا يعيد استخدام/إنشاء ملف شخصي حسب البصمة
 */
export function resolveAbrProfileForRungs(
  settings: EncodingQualitySettings,
  selectedRungIds: string[] | null | undefined,
): AbrProfileResolution {
  const globalEnabled = enabledEncodingRungs(settings);
  const globalIds = globalEnabled.map((rung) => rung.id);
  const selectedRaw =
    selectedRungIds && selectedRungIds.length > 0
      ? selectedRungIds.map((id) => id.trim()).filter(Boolean)
      : globalIds;

  const selected = [...new Set(selectedRaw)];
  const notAllowed = selected.filter((id) => !globalIds.includes(id));
  if (notAllowed.length) {
    throw new Error(
      `جودات غير مفعّلة في الإعدادات العامة: ${notAllowed.join(', ')}`,
    );
  }
  if (!selected.length) {
    throw new Error('يجب تفعيل جودة واحدة على الأقل لترميز GPU');
  }

  const byId = new Map(globalEnabled.map((rung) => [rung.id, rung]));
  const resolvedRungs = selected
    .map((id) => byId.get(id))
    .filter((rung): rung is NonNullable<typeof rung> => Boolean(rung));

  const rungIds = resolvedRungs.map((rung) => rung.id);
  const globalScript = resolveAbrScriptPath();
  const globalConfig = resolveAbrConfigPath();

  if (sameRungIdSet(rungIds, globalIds)) {
    return {
      profileKey: null,
      scriptPath: globalScript,
      configPath: globalConfig,
      isGlobal: true,
      rungIds,
    };
  }

  const profileKey = abrProfileKeyFromRungIds(rungIds);
  const profileDir = path.join(resolveAbrProfilesDir(), profileKey);
  const configPath = path.join(profileDir, 'config.json');
  const scriptPath = path.join(profileDir, 'run.sh');

  mkdirSync(profileDir, { recursive: true });
  const payload = {
    version: 1,
    profileKey,
    updatedAt: new Date().toISOString(),
    fps: settings.fps,
    gop: settings.gop,
    audioBitrateKbps: settings.audioBitrateKbps,
    audioSampleRate: settings.audioSampleRate,
    nvencPreset: settings.nvencPreset,
    rungs: resolvedRungs.map((rung) => ({ ...rung, enabled: true })),
  };
  // حدّث الملف دائماً ليعكس bitrates الحالية من الإعدادات العامة
  writeFileSync(configPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  if (!existsSync(scriptPath)) {
    const body = [
      '#!/bin/bash',
      `# ABR profile ${profileKey} — يُعاد استخدامه للقنوات بنفس الجودات`,
      `exec ${shellSingleQuote(globalScript)} "$1" ${shellSingleQuote(configPath)}`,
      '',
    ].join('\n');
    writeFileSync(scriptPath, body, 'utf8');
    chmodSync(scriptPath, 0o755);
  }

  return {
    profileKey,
    scriptPath,
    configPath,
    isGlobal: false,
    rungIds,
  };
}

function shellSingleQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
