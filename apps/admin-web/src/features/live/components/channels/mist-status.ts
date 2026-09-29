import type { MistStreamRuntime } from '@/features/live/types';

export function mistStatusLabel(mist?: MistStreamRuntime) {
  if (!mist || !mist.configured) {
    return { text: 'غير مسجّلة', tone: 'missing' as const, detail: null };
  }
  if (mist.online === 1) {
    return { text: 'نشطة', tone: 'ok' as const, detail: mist.error };
  }
  if (mist.online === 2) {
    return {
      text: 'غير نشطة',
      tone: 'degraded' as const,
      detail: mist.error,
    };
  }
  if (mist.online === 0) {
    return {
      text: 'خطأ',
      tone: 'error' as const,
      detail: mist.error,
    };
  }
  return { text: 'غير معروف', tone: 'missing' as const, detail: mist.error };
}
