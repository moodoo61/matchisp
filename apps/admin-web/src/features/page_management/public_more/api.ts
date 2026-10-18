import type { PublicMorePage } from './types';

/** جلب عام بدون جلسة لوحة التحكم */
async function publicFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message;
    throw new Error(message ?? 'تعذر التحميل');
  }
  return (await res.json()) as T;
}

export function getPublicMorePage() {
  return publicFetch<PublicMorePage>('/api/public/more');
}
