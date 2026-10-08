/** كتالوج خطوط واجهة الإدارة — تُنزَّل وتُخزَّن محلياً عند الاختيار */

export type GeneralUiFontDef = {
  id: string;
  /** اسم العائلة في CSS */
  family: string;
  /** تسمية العرض بالعربية */
  label: string;
  /** اسم العائلة في Google Fonts (مع +) */
  googleFamily: string;
  weights: readonly number[];
};

export const DEFAULT_UI_FONT_ID = 'ibm-plex-sans-arabic';

export const GENERAL_UI_FONTS = [
  {
    id: 'ibm-plex-sans-arabic',
    family: 'IBM Plex Sans Arabic',
    label: 'IBM Plex Sans Arabic',
    googleFamily: 'IBM+Plex+Sans+Arabic',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'tajawal',
    family: 'Tajawal',
    label: 'تجوال (Tajawal)',
    googleFamily: 'Tajawal',
    weights: [400, 500, 700],
  },
  {
    id: 'cairo',
    family: 'Cairo',
    label: 'القاهرة (Cairo)',
    googleFamily: 'Cairo',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'noto-sans-arabic',
    family: 'Noto Sans Arabic',
    label: 'Noto Sans Arabic',
    googleFamily: 'Noto+Sans+Arabic',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'noto-naskh-arabic',
    family: 'Noto Naskh Arabic',
    label: 'Noto Naskh Arabic',
    googleFamily: 'Noto+Naskh+Arabic',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'noto-kufi-arabic',
    family: 'Noto Kufi Arabic',
    label: 'Noto Kufi Arabic',
    googleFamily: 'Noto+Kufi+Arabic',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'almarai',
    family: 'Almarai',
    label: 'المراعي (Almarai)',
    googleFamily: 'Almarai',
    weights: [400, 700],
  },
  {
    id: 'changa',
    family: 'Changa',
    label: 'شنقة (Changa)',
    googleFamily: 'Changa',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'rubik',
    family: 'Rubik',
    label: 'Rubik',
    googleFamily: 'Rubik',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'readex-pro',
    family: 'Readex Pro',
    label: 'Readex Pro',
    googleFamily: 'Readex+Pro',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'el-messiri',
    family: 'El Messiri',
    label: 'المسيري (El Messiri)',
    googleFamily: 'El+Messiri',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'amiri',
    family: 'Amiri',
    label: 'أميري (Amiri)',
    googleFamily: 'Amiri',
    weights: [400, 700],
  },
  {
    id: 'scheherazade-new',
    family: 'Scheherazade New',
    label: 'شهرزاد (Scheherazade New)',
    googleFamily: 'Scheherazade+New',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'lateef',
    family: 'Lateef',
    label: 'لطيف (Lateef)',
    googleFamily: 'Lateef',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'harmattan',
    family: 'Harmattan',
    label: 'Harmattan',
    googleFamily: 'Harmattan',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'markazi-text',
    family: 'Markazi Text',
    label: 'مركزي (Markazi Text)',
    googleFamily: 'Markazi+Text',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'reem-kufi',
    family: 'Reem Kufi',
    label: 'ريم كوفي (Reem Kufi)',
    googleFamily: 'Reem+Kufi',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'mada',
    family: 'Mada',
    label: 'مدى (Mada)',
    googleFamily: 'Mada',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'lemonada',
    family: 'Lemonada',
    label: 'ليمونادة (Lemonada)',
    googleFamily: 'Lemonada',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'alexandria',
    family: 'Alexandria',
    label: 'الإسكندرية (Alexandria)',
    googleFamily: 'Alexandria',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'baloo-bhaijaan-2',
    family: 'Baloo Bhaijaan 2',
    label: 'بالو بهيجان (Baloo Bhaijaan 2)',
    googleFamily: 'Baloo+Bhaijaan+2',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'kufam',
    family: 'Kufam',
    label: 'كوفام (Kufam)',
    googleFamily: 'Kufam',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'marhey',
    family: 'Marhey',
    label: 'مرحي (Marhey)',
    googleFamily: 'Marhey',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'aref-ruqaa',
    family: 'Aref Ruqaa',
    label: 'عارف رقعة (Aref Ruqaa)',
    googleFamily: 'Aref+Ruqaa',
    weights: [400, 700],
  },
  {
    id: 'lalezar',
    family: 'Lalezar',
    label: 'لاله‌زار (Lalezar)',
    googleFamily: 'Lalezar',
    weights: [400],
  },
  {
    id: 'mirza',
    family: 'Mirza',
    label: 'ميرزا (Mirza)',
    googleFamily: 'Mirza',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'katibeh',
    family: 'Katibeh',
    label: 'كتيبة (Katibeh)',
    googleFamily: 'Katibeh',
    weights: [400],
  },
  {
    id: 'jomhuria',
    family: 'Jomhuria',
    label: 'جمهورية (Jomhuria)',
    googleFamily: 'Jomhuria',
    weights: [400],
  },
  {
    id: 'rakkas',
    family: 'Rakkas',
    label: 'رقّاص (Rakkas)',
    googleFamily: 'Rakkas',
    weights: [400],
  },
  {
    id: 'gulzar',
    family: 'Gulzar',
    label: 'گلزار (Gulzar)',
    googleFamily: 'Gulzar',
    weights: [400],
  },
  {
    id: 'zain',
    family: 'Zain',
    label: 'زين (Zain)',
    googleFamily: 'Zain',
    weights: [400, 700],
  },
  {
    id: 'ruwudu',
    family: 'Ruwudu',
    label: 'رُوودو (Ruwudu)',
    googleFamily: 'Ruwudu',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'vazirmatn',
    family: 'Vazirmatn',
    label: 'وزيرمتن (Vazirmatn)',
    googleFamily: 'Vazirmatn',
    weights: [400, 500, 600, 700],
  },
] as const satisfies readonly GeneralUiFontDef[];

export const GENERAL_UI_FONT_IDS = GENERAL_UI_FONTS.map((f) => f.id);

export type GeneralUiFontId = (typeof GENERAL_UI_FONTS)[number]['id'];

export function findUiFont(id: string): GeneralUiFontDef | undefined {
  return GENERAL_UI_FONTS.find((f) => f.id === id);
}

export function resolveUiFontId(id: string | null | undefined): GeneralUiFontId {
  if (id && GENERAL_UI_FONT_IDS.includes(id as GeneralUiFontId)) {
    return id as GeneralUiFontId;
  }
  return DEFAULT_UI_FONT_ID;
}
