import path from 'node:path';
import { ENCODING_SOURCE_MODE_META } from '@isp/shared';
import type {
  SourceOptionDefinition,
  SourceOptionInput,
} from '../source-option.types';
import { resolveAbrScriptPath } from '../../quality/abr-runtime-config';

/**
 * ترميز GPU — سكربت عام أو مخصص حسب جودات القناة.
 */
export const encodeGpuSourceOption: SourceOptionDefinition = {
  mode: 'encode_gpu',
  label: ENCODING_SOURCE_MODE_META.encode_gpu.label,
  description: ENCODING_SOURCE_MODE_META.encode_gpu.description,
  resolveMistSource,
};

function resolveMistSource(input: SourceOptionInput): string {
  if (input.type !== 'IPTV') {
    throw new Error('ترميز GPU يدعم مصادر IPTV حالياً');
  }
  const source = input.sourceUrl?.trim();
  if (!source) {
    throw new Error('مصدر IPTV مطلوب لترميز GPU');
  }

  const script = input.abrScriptPath?.trim() || resolveAbrScriptPath();
  if (!path.isAbsolute(script)) {
    throw new Error('مسار سكربت ABR يجب أن يكون مطلقاً');
  }
  return `ts-exec:${shellEscape(script)} ${shellEscape(source)}`;
}

function shellEscape(value: string) {
  if (/^[A-Za-z0-9_./:@%?&=+-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
