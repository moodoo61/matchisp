import path from 'node:path';
import { ENCODING_SOURCE_MODE_META } from '@isp/shared';
import type {
  SourceOptionDefinition,
  SourceOptionInput,
} from '../source-option.types';
import { resolveAbrScriptPath } from '../../quality/abr-runtime-config';

/**
 * ترميز GPU — سكربت عام أو مخصص حسب جودات القناة.
 * يدعم IPTV (رابط) و HDMI (v4l2 + ALSA).
 */
export const encodeGpuSourceOption: SourceOptionDefinition = {
  mode: 'encode_gpu',
  label: ENCODING_SOURCE_MODE_META.encode_gpu.label,
  description: ENCODING_SOURCE_MODE_META.encode_gpu.description,
  resolveMistSource,
};

function resolveMistSource(input: SourceOptionInput): string {
  const script = input.abrScriptPath?.trim() || resolveAbrScriptPath();
  if (!path.isAbsolute(script)) {
    throw new Error('مسار سكربت ABR يجب أن يكون مطلقاً');
  }

  if (input.type === 'IPTV') {
    const source = input.sourceUrl?.trim();
    if (!source) {
      throw new Error('مصدر IPTV مطلوب لترميز GPU');
    }
    return `ts-exec:${shellEscape(script)} ${shellEscape(source)}`;
  }

  if (input.type === 'HDMI') {
    const video = input.videoDevice?.trim();
    const audio = input.audioDevice?.trim();
    if (!video || !audio) {
      throw new Error('مسارا الفيديو والصوت مطلوبان لترميز GPU عبر HDMI');
    }
    return `ts-exec:${shellEscape(script)} --hdmi ${shellEscape(video)} ${shellEscape(audio)}`;
  }

  throw new Error('نوع مصدر غير مدعوم لترميز GPU');
}

function shellEscape(value: string) {
  // الفاصلة مسموحة لـ ALSA مثل hw:1,0 (بدون علامات اقتباس)
  if (/^[A-Za-z0-9_.,/:@%?&=+-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
