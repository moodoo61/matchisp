import type { ToastApi } from './ToastContext';

/** غلاف مشترك لعمليات الإضافة/التعديل/الحذف مع إشعار النتيجة */
export async function notifyMutation<T>(
  toast: ToastApi,
  action: () => Promise<T>,
  messages: {
    success: string;
    error?: string;
  },
): Promise<T> {
  try {
    const result = await action();
    toast.success(messages.success);
    return result;
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : messages.error ?? 'تعذر إتمام العملية',
    );
    throw err;
  }
}
