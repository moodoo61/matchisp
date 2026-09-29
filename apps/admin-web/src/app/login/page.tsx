'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setTokens } from '@/lib/api';
import { setAuthUser } from '@/lib/authSession';
import type { LoginResponse } from '@isp/shared';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => null)) as
        | (LoginResponse & { message?: string | string[] })
        | null;
      if (!res.ok) {
        const message = Array.isArray(data?.message)
          ? data.message.join(', ')
          : data?.message;
        throw new Error(message ?? 'فشل تسجيل الدخول');
      }
      if (!data?.tokens) {
        throw new Error('استجابة غير صالحة من الخادم');
      }
      setTokens(data.tokens);
      if (data.user) setAuthUser(data.user);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>ISP Admin</h1>
        <p>تسجيل الدخول إلى لوحة الإدارة — المرحلة أ</p>
        {error ? <div className="error">{error}</div> : null}
        <form className="form" onSubmit={onSubmit}>
          <label>
            اسم المستخدم
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              name="username"
              required
            />
          </label>
          <label>
            كلمة المرور
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              name="password"
              required
            />
          </label>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
