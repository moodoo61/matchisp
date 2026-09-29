import {
  DEFAULT_ENCODING_SOURCE_MODE,
  ENCODING_SOURCE_MODE_META,
  ENCODING_SOURCE_MODES,
  type EncodingSourceMode,
} from '@isp/shared';
import { passthroughSourceOption } from './passthrough/passthrough.option';
import { passthroughFfmpegSourceOption } from './passthrough-ffmpeg/passthrough-ffmpeg.option';
import { encodeGpuSourceOption } from './encode-gpu/encode-gpu.option';
import type {
  SourceOptionDefinition,
  SourceOptionInput,
  SourceOptionListItem,
} from './source-option.types';

/** الخيارات المُنفَّذة حالياً — يُضاف كل خيار جديد هنا بعد عزل ملفه */
const IMPLEMENTED: readonly SourceOptionDefinition[] = [
  passthroughSourceOption,
  passthroughFfmpegSourceOption,
  encodeGpuSourceOption,
];

const byMode = new Map(IMPLEMENTED.map((item) => [item.mode, item]));

export function listImplementedSourceOptions(): SourceOptionDefinition[] {
  return [...IMPLEMENTED];
}

/** قائمة للواجهة: المتاح أولاً ثم غير المُنفَّذ */
export function listSourceOptionCatalog(): SourceOptionListItem[] {
  return ENCODING_SOURCE_MODES.map((mode) => {
    const impl = byMode.get(mode);
    const meta = ENCODING_SOURCE_MODE_META[mode];
    return {
      value: mode,
      label: impl?.label ?? meta.label,
      description: impl?.description ?? meta.description,
      available: Boolean(impl),
    };
  });
}

export function getSourceOption(
  mode: EncodingSourceMode,
): SourceOptionDefinition | undefined {
  return byMode.get(mode);
}

export function assertSourceOptionAvailable(
  mode: EncodingSourceMode,
): SourceOptionDefinition {
  const option = byMode.get(mode);
  if (!option) {
    throw new Error(
      `خيار المصدر «${ENCODING_SOURCE_MODE_META[mode].label}» غير مُفعَّل بعد`,
    );
  }
  return option;
}

export function buildMistSourceForMode(
  mode: EncodingSourceMode,
  input: SourceOptionInput,
): string {
  return assertSourceOptionAvailable(mode).resolveMistSource(input);
}

export function resolveDefaultSourceMode(
  preferred?: EncodingSourceMode | null,
): EncodingSourceMode {
  if (preferred && byMode.has(preferred)) return preferred;
  if (byMode.has(DEFAULT_ENCODING_SOURCE_MODE)) {
    return DEFAULT_ENCODING_SOURCE_MODE;
  }
  return IMPLEMENTED[0]?.mode ?? DEFAULT_ENCODING_SOURCE_MODE;
}
