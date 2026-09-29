/** سلم جودات ABR لترميز GPU */
export type EncodingQualityRung = {
  /** معرّف داخلي مثل p720 */
  id: string;
  /** اسم العرض مثل 720p */
  label: string;
  /** تفعيل هذه الجودة في ملف الترميز */
  enabled: boolean;
  width: number;
  height: number;
  /** معدل البت الأساسي بالكبلوبت (مثل 1800) */
  bitrateKbps: number;
  maxrateKbps: number;
  bufsizeKbps: number;
};

export type EncodingQualitySettings = {
  /** إطارات في الثانية — ثابتة من النظام */
  fps: number;
  /** مسافة المفتاح — ثابتة من النظام */
  gop: number;
  audioBitrateKbps: number;
  audioSampleRate: number;
  /** إعداد NVENC مثل p4 */
  nvencPreset: string;
  rungs: EncodingQualityRung[];
};

/** سلم الجودات الافتراضي (من الأعلى للأقل) */
export const DEFAULT_ENCODING_QUALITY: EncodingQualitySettings = {
  fps: 25,
  gop: 150,
  audioBitrateKbps: 128,
  audioSampleRate: 48000,
  nvencPreset: 'p4',
  rungs: [
    {
      id: 'p1080',
      label: '1080p',
      enabled: true,
      width: 1920,
      height: 1080,
      bitrateKbps: 4000,
      maxrateKbps: 4000,
      bufsizeKbps: 4000,
    },
    {
      id: 'p720',
      label: '720p',
      enabled: true,
      width: 1280,
      height: 720,
      bitrateKbps: 1800,
      maxrateKbps: 1800,
      bufsizeKbps: 1800,
    },
    {
      id: 'p480',
      label: '480p',
      enabled: true,
      width: 854,
      height: 480,
      bitrateKbps: 800,
      maxrateKbps: 800,
      bufsizeKbps: 800,
    },
    {
      id: 'p288',
      label: '288p',
      enabled: true,
      width: 512,
      height: 288,
      bitrateKbps: 300,
      maxrateKbps: 300,
      bufsizeKbps: 300,
    },
    {
      id: 'p144',
      label: '144p',
      enabled: true,
      width: 256,
      height: 144,
      bitrateKbps: 150,
      maxrateKbps: 150,
      bufsizeKbps: 150,
    },
  ],
};

/** توافق مع المعرّفات القديمة v0/v1/v2 */
const LEGACY_ID_MAP: Record<string, string> = {
  v0: 'p720',
  v1: 'p480',
  v2: 'p288',
};

export function normalizeEncodingQuality(
  input: {
    rungs?: Array<Partial<EncodingQualityRung> & { id?: string }>;
  } | null | undefined,
): EncodingQualitySettings {
  const base = DEFAULT_ENCODING_QUALITY;
  const incoming = Array.isArray(input?.rungs) ? input.rungs : [];

  const rungs = base.rungs.map((template) => {
    const patch =
      incoming.find((item) => {
        const id = item?.id ? LEGACY_ID_MAP[item.id] ?? item.id : undefined;
        return id === template.id;
      }) ??
      incoming.find(
        (item) =>
          Number(item?.width) === template.width &&
          Number(item?.height) === template.height,
      );

    return {
      id: template.id,
      label: template.label,
      enabled: patch?.enabled === undefined ? true : Boolean(patch.enabled),
      width: template.width,
      height: template.height,
      bitrateKbps: clampInt(
        patch?.bitrateKbps,
        50,
        50000,
        template.bitrateKbps,
      ),
      maxrateKbps: clampInt(
        patch?.maxrateKbps,
        50,
        50000,
        template.maxrateKbps,
      ),
      bufsizeKbps: clampInt(
        patch?.bufsizeKbps,
        50,
        100000,
        template.bufsizeKbps,
      ),
    };
  });

  return {
    fps: base.fps,
    gop: base.gop,
    audioBitrateKbps: base.audioBitrateKbps,
    audioSampleRate: base.audioSampleRate,
    nvencPreset: base.nvencPreset,
    rungs,
  };
}

/** الجودات المفعّلة فقط — ما يُكتب لملف السكربت */
export function enabledEncodingRungs(settings: EncodingQualitySettings) {
  return settings.rungs.filter((rung) => rung.enabled);
}

function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}
