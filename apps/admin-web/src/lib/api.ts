/**
 * نفس الأصل عبر Next rewrite إلى Nest.
 * لا تعتمد على IP ثابت في المتصفح — يعمل مع localhost والدومين.
 */
export function getApiBase(): string {
  return '';
}

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

const ACCESS_KEY = 'isp_access_token';
const REFRESH_KEY = 'isp_refresh_token';

export function getTokens(): Tokens | null {
  if (typeof window === 'undefined') return null;
  const accessToken = localStorage.getItem(ACCESS_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function setTokens(tokens: Tokens) {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  // تُستدعى clearAuthUser من المستدعي عند الحاجة
}

async function refreshAccess(): Promise<Tokens | null> {
  const current = getTokens();
  if (!current) return null;
  const res = await fetch(`${getApiBase()}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: current.refreshToken }),
  });
  if (!res.ok) {
    clearTokens();
    return null;
  }
  const data = (await res.json()) as { tokens: Tokens };
  setTokens(data.tokens);
  return data.tokens;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const tokens = getTokens();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (tokens?.accessToken) {
    headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }

  const res = await fetch(`${getApiBase()}/api${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccess();
    if (refreshed) {
      return api<T>(path, options, false);
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('غير مصرح');
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message;
    throw new Error(message ?? `خطأ ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

/** رفع ملف multipart دون Content-Type: application/json */
export async function apiUpload<T>(
  path: string,
  file: File,
  fieldName = 'file',
  retry = true,
): Promise<T> {
  const tokens = getTokens();
  const body = new FormData();
  body.append(fieldName, file);

  const headers = new Headers();
  if (tokens?.accessToken) {
    headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }

  const res = await fetch(`${getApiBase()}/api${path}`, {
    method: 'POST',
    headers,
    body,
  });

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccess();
    if (refreshed) {
      return apiUpload<T>(path, file, fieldName, false);
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('غير مصرح');
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message;
    throw new Error(message ?? `خطأ ${res.status}`);
  }

  return (await res.json()) as T;
}

/** @deprecated استخدم getApiBase() — الإبقاء للتوافق */
export const API_URL = '';
