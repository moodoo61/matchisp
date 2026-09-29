import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  enabledEncodingRungs,
  type EncodingQualitySettings,
} from '@isp/shared';

function monorepoRoot() {
  // quality → encoding → service → live → modules → src|dist → api → apps → root
  return path.resolve(__dirname, '../../../../../../../..');
}

/** مسار سكربت ABR المُدار من المشروع (بدل متغير Mist $abr) */
export function resolveAbrScriptPath() {
  return (
    process.env.LIVE_ABR_SCRIPT_PATH?.trim() ||
    path.join(monorepoRoot(), 'scripts/live/abr_nvenc.sh')
  );
}

/** ملف الإعداد الذي يقرأه السكربت عند التشغيل */
export function resolveAbrConfigPath() {
  return (
    process.env.LIVE_ABR_CONFIG_PATH?.trim() ||
    path.join(monorepoRoot(), 'var/live/abr_nvenc.json')
  );
}

/**
 * كتابة إعدادات الجودة لملف يستهلكه abr_nvenc.sh
 * يُدرج فقط الجودات المفعّلة — التعطيل يحذفها من سلم الترميز.
 */
export function writeAbrRuntimeConfig(settings: EncodingQualitySettings) {
  const configPath = resolveAbrConfigPath();
  mkdirSync(path.dirname(configPath), { recursive: true });
  const activeRungs = enabledEncodingRungs(settings);
  const payload = {
    version: 1,
    updatedAt: new Date().toISOString(),
    fps: settings.fps,
    gop: settings.gop,
    audioBitrateKbps: settings.audioBitrateKbps,
    audioSampleRate: settings.audioSampleRate,
    nvencPreset: settings.nvencPreset,
    rungs: activeRungs,
  };
  writeFileSync(configPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return configPath;
}
