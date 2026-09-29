import type { EncodingSourceMode } from '@isp/shared';

/** مدخلات بناء مصدر MistServer من بيانات القناة */
export type SourceOptionInput = {
  type: 'IPTV' | 'HDMI';
  sourceUrl?: string | null;
  videoDevice?: string | null;
  audioDevice?: string | null;
  /** مسار سكربت ABR مخصص (encode_gpu) */
  abrScriptPath?: string | null;
};

/** تعريف خيار مصدر مُنفَّذ (معالج مستقل) */
export type SourceOptionDefinition = {
  mode: EncodingSourceMode;
  label: string;
  description: string;
  /** يبني قيمة source التي تُرسل إلى MistServer */
  resolveMistSource: (input: SourceOptionInput) => string;
};

export type SourceOptionListItem = {
  value: EncodingSourceMode;
  label: string;
  description: string;
  available: boolean;
};
