export type ToastTone = 'success' | 'error' | 'info';

export type ToastInput = {
  title?: string;
  message: string;
  tone?: ToastTone;
  /** مدة الظهور بالميلي ثانية — افتراضي 3500 */
  durationMs?: number;
};

export type ToastItem = ToastInput & {
  id: string;
  tone: ToastTone;
  durationMs: number;
};
