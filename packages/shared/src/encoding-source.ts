/** أوضاع مصدر الترميز لقسم البث المباشر */
export const ENCODING_SOURCE_MODES = [
  'passthrough',
  'passthrough_ffmpeg',
  'encode_cpu',
  'encode_gpu',
] as const;

export type EncodingSourceMode = (typeof ENCODING_SOURCE_MODES)[number];

export const DEFAULT_ENCODING_SOURCE_MODE: EncodingSourceMode = 'passthrough';

export const ENCODING_SOURCE_MODE_META: Record<
  EncodingSourceMode,
  { label: string; description: string }
> = {
  passthrough: {
    label: 'مباشر',
    description: 'بدون إعادة ترميز — التدفق يُمرَّر كما هو',
  },
  passthrough_ffmpeg: {
    label: 'مباشر ffmpeg',
    description: 'نسخ التدفقات عبر سكربت ffmpeg بدون إعادة ترميز',
  },
  encode_cpu: {
    label: 'ترميز CPU',
    description: 'إعادة ترميز برمجي على المعالج',
  },
  encode_gpu: {
    label: 'ترميز GPU',
    description:
      'إعادة ترميز عتادي NVENC بسلم جودات قابل للضبط من خيارات الجودة',
  },
};

export function isEncodingSourceMode(value: unknown): value is EncodingSourceMode {
  return (
    typeof value === 'string' &&
    (ENCODING_SOURCE_MODES as readonly string[]).includes(value)
  );
}
