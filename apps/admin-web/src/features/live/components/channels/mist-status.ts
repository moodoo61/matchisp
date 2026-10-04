import type { MistStreamRuntime } from '@/features/live/types';

/**
 * تسميات حالة Mist للقنوات.
 * online: 1=نشط، 2=غير نشط، 0=قد يعني توقفاً أو خطأ —
 * نعرض «خطأ» فقط عند وجود رسالة خطأ فعلية من Mist.
 */
export function mistStatusLabel(mist?: MistStreamRuntime) {
  if (!mist || !mist.configured) {
    return { text: 'غير مسجّلة', tone: 'missing' as const, detail: null };
  }

  if (mist.online === 1) {
    return { text: 'نشطة', tone: 'ok' as const, detail: mist.error };
  }

  const errorText = mist.error?.trim() || null;
  if (errorText) {
    return { text: 'خطأ', tone: 'error' as const, detail: errorText };
  }

  // بدون رسالة خطأ: غير نشطة (يشمل online=0 أو 2 أو null)
  if (mist.online === 2 || mist.online === 0 || mist.online == null) {
    return {
      text: 'غير نشطة',
      tone: 'degraded' as const,
      detail: null,
    };
  }

  return { text: 'غير معروف', tone: 'missing' as const, detail: null };
}
