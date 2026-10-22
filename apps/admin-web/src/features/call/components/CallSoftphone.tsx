'use client';

import { useEffect, useRef, useState } from 'react';
import {
  clearSavedCallLine,
  loadSavedCallLine,
  saveCallLine,
} from '../lib/call-session-store';
import {
  Softphone,
  isCallSecureContext,
  resolveCallConfig,
  secureContextMessage,
} from '../lib/sip-session';
import { AndroidAppDownloadLink } from '@/features/comms/components/AndroidAppDownloadLink';
import type { CallConfig, CallStatus, RegStatus } from '../types';

const DIAL_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as const;

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function regLabel(status: RegStatus) {
  switch (status) {
    case 'connecting':
      return 'جارٍ التسجيل…';
    case 'registered':
      return 'مسجّل ومتاح';
    case 'unregistered':
      return 'غير مسجّل';
    case 'failed':
      return 'فشل التسجيل';
    default:
      return 'بانتظار التسجيل';
  }
}

function callLabel(status: CallStatus) {
  switch (status) {
    case 'dialing':
      return 'جارٍ الطلب…';
    case 'ringing':
      return 'يرن…';
    case 'incoming':
      return 'مكالمة واردة';
    case 'active':
      return 'مكالمة جارية';
    case 'ended':
      return 'انتهت المكالمة';
    case 'failed':
      return 'فشل الاتصال';
    default:
      return 'جاهز للاتصال';
  }
}

export function CallSoftphone() {
  const phoneRef = useRef<Softphone | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const autoRegisterTried = useRef(false);

  // يُضبط بعد الـ mount فقط لتفادي اختلاف SSR/العميل (hostname)
  const [config, setConfig] = useState<CallConfig | null>(null);
  const [secureOk, setSecureOk] = useState(true);
  const [secureHint, setSecureHint] = useState('');
  const [extension, setExtension] = useState('');
  const [password, setPassword] = useState('');
  const [destination, setDestination] = useState('');
  const [regStatus, setRegStatus] = useState<RegStatus>('idle');
  const [regDetail, setRegDetail] = useState('');
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callDetail, setCallDetail] = useState('');
  const [incomingFrom, setIncomingFrom] = useState('');
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfig(resolveCallConfig());
    const ok = isCallSecureContext();
    setSecureOk(ok);
    setSecureHint(ok ? '' : secureContextMessage());
    const saved = loadSavedCallLine();
    if (saved) {
      setExtension(saved.extension);
      setPassword(saved.password);
    }
  }, []);

  useEffect(() => {
    if (!config) return;
    const phone = new Softphone(config.wssUrl, config.sipDomain, {
      onRegStatus: (status, detail) => {
        setRegStatus(status);
        setRegDetail(detail || '');
      },
      onCallStatus: (status, detail) => {
        setCallStatus(status);
        setCallDetail(detail || '');
        if (status === 'ended' || status === 'failed' || status === 'idle') {
          setIncomingFrom('');
          setMuted(false);
        }
      },
      onRemoteStream: (stream) => {
        const el = remoteAudioRef.current;
        if (!el) return;
        el.srcObject = stream;
        if (stream) void el.play().catch(() => undefined);
      },
      onIncoming: (from) => setIncomingFrom(from),
    });
    phoneRef.current = phone;
    return () => {
      // تحديث الصفحة: أغلق الـ UA دون إلغاء التسجيل الرسمي (يُعاد التسجيل تلقائياً)
      void phone.disconnect({ unregister: false });
      phoneRef.current = null;
    };
  }, [config]);

  // إعادة التسجيل تلقائياً من localStorage بعد تهيئة Softphone
  useEffect(() => {
    if (!config || !secureOk || !phoneRef.current || autoRegisterTried.current) {
      return;
    }
    const saved = loadSavedCallLine();
    if (!saved) return;
    autoRegisterTried.current = true;
    setBusy(true);
    setError(null);
    void phoneRef.current
      .register(saved.extension, saved.password)
      .catch((err) => {
        const raw = err instanceof Error ? err.message : 'تعذر التسجيل';
        setError(
          /insecure context|media devices/i.test(raw)
            ? secureContextMessage() || raw
            : raw,
        );
      })
      .finally(() => setBusy(false));
  }, [config, secureOk]);

  useEffect(() => {
    if (callStatus === 'active') {
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed((n) => n + 1);
      }, 1000);
    } else if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [callStatus]);

  const registered = regStatus === 'registered';
  const inCall =
    callStatus === 'dialing' ||
    callStatus === 'ringing' ||
    callStatus === 'incoming' ||
    callStatus === 'active';

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!secureOk) {
      setError(secureHint || 'يتطلب الاتصال سياقاً آمناً (HTTPS)');
      return;
    }
    if (!phoneRef.current) {
      setError('جارٍ تهيئة الاتصال… حاول مجدداً');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await phoneRef.current.register(extension, password);
      saveCallLine({ extension: extension.trim(), password });
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'تعذر التسجيل';
      setError(
        /insecure context|media devices/i.test(raw)
          ? secureContextMessage() || raw
          : raw,
      );
    } finally {
      setBusy(false);
    }
  }

  async function onDial() {
    setError(null);
    if (!secureOk) {
      setError(secureHint || 'يتطلب الاتصال سياقاً آمناً (HTTPS)');
      return;
    }
    setBusy(true);
    try {
      await phoneRef.current?.dial(destination);
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'تعذر الاتصال';
      setError(
        /insecure context|media devices/i.test(raw)
          ? secureContextMessage() || raw
          : raw,
      );
    } finally {
      setBusy(false);
    }
  }

  async function onUnregister() {
    setBusy(true);
    setError(null);
    try {
      clearSavedCallLine();
      autoRegisterTried.current = true;
      await phoneRef.current?.disconnect({ unregister: true });
    } finally {
      setBusy(false);
    }
  }

  async function onAnswer() {
    setError(null);
    try {
      await phoneRef.current?.answer();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الرد');
    }
  }

  async function onReject() {
    try {
      await phoneRef.current?.reject();
    } catch {
      /* ignore */
    }
  }

  async function onHangup() {
    try {
      await phoneRef.current?.hangup();
    } catch {
      /* ignore */
    }
  }

  function toggleMute() {
    const next = !muted;
    phoneRef.current?.setMuted(next);
    setMuted(next);
  }

  function pressDial(key: string) {
    if (inCall) return;
    setDestination((v) => `${v}${key}`);
  }

  const regClass =
    regStatus === 'registered'
      ? 'is-ok'
      : regStatus === 'failed'
        ? 'is-err'
        : regStatus === 'connecting'
          ? 'is-busy'
          : '';

  return (
    <div className="call-page">
      <header className="call-brand">
        <h1>الاتصال</h1>
        <p>هاتف صوتي عبر المتصفح — سجّل رقمك ثم اطلب الطرف الآخر</p>
        <div className="call-download">
          <AndroidAppDownloadLink className="call-download-btn" />
        </div>
      </header>

      <div className="call-shell">
        {!secureOk && secureHint ? (
          <section className="call-panel call-secure-banner">
            <h2>مطلوب HTTPS للميكروفون</h2>
            <p className="call-error" style={{ margin: 0 }}>
              {secureHint}
            </p>
            <p className="call-hint">
              افتح الصفحة عبر HTTPS الموثوق (بدون تحذير شهادة).
            </p>
          </section>
        ) : null}

        <section className="call-panel">
          <span className={`call-status ${regClass}`}>
            <span className="call-status-dot" aria-hidden />
            {regLabel(regStatus)}
            {regDetail ? ` — ${regDetail}` : ''}
          </span>

          {!registered ? (
            <form onSubmit={(e) => void onRegister(e)}>
              <h2>تسجيل الخط</h2>
              <label className="call-field">
                الرقم الداخلي
                <input
                  value={extension}
                  onChange={(e) => setExtension(e.target.value)}
                  placeholder="1001"
                  required
                  autoComplete="username"
                  inputMode="numeric"
                />
              </label>
              <label className="call-field">
                كلمة المرور
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </label>
              <div className="call-actions">
                <button
                  type="submit"
                  className="call-btn call-btn-primary"
                  disabled={busy || !config || !extension || !password}
                >
                  {busy ? 'جارٍ…' : 'تسجيل'}
                </button>
              </div>
              <p className="call-hint">
                استخدم رقماً من قسم «الاتصال» في لوحة التحكم. الطرفان يفتحان هذه
                الصفحة ويسجّل كلٌّ منهما رقمه، ثم يطلب أحدهما رقم الآخر. يُحفظ
                تسجيل الدخول محلياً ويُعاد تلقائياً بعد تحديث الصفحة.
              </p>
            </form>
          ) : (
            <>
              <h2>خطك: {extension}</h2>
              <div className="call-actions">
                <button
                  type="button"
                  className="call-btn call-btn-ghost"
                  onClick={() => void onUnregister()}
                  disabled={busy || inCall}
                >
                  إلغاء التسجيل
                </button>
              </div>
            </>
          )}
        </section>

        {registered ? (
          <section className="call-panel">
            <span
              className={`call-status ${
                callStatus === 'active'
                  ? 'is-ok'
                  : callStatus === 'incoming' || callStatus === 'ringing'
                    ? 'is-busy'
                    : callStatus === 'failed'
                      ? 'is-err'
                      : ''
              }`}
            >
              <span className="call-status-dot" aria-hidden />
              {callLabel(callStatus)}
              {callDetail && callStatus !== 'active' ? ` — ${callDetail}` : ''}
            </span>

            {callStatus === 'incoming' ? (
              <div className="call-incoming-banner">
                مكالمة واردة من <strong dir="ltr">{incomingFrom}</strong>
              </div>
            ) : null}

            {callStatus === 'active' ? (
              <>
                <p className="call-peer" dir="ltr">
                  {callDetail || destination || incomingFrom || '—'}
                </p>
                <div className="call-timer">{formatTimer(elapsed)}</div>
                <div className="call-actions">
                  <button
                    type="button"
                    className="call-btn call-btn-ghost"
                    onClick={toggleMute}
                  >
                    {muted ? 'إلغاء الكتم' : 'كتم الصوت'}
                  </button>
                  <button
                    type="button"
                    className="call-btn call-btn-danger"
                    onClick={() => void onHangup()}
                  >
                    إنهاء
                  </button>
                </div>
              </>
            ) : null}

            {callStatus === 'incoming' ? (
              <div className="call-actions">
                <button
                  type="button"
                  className="call-btn call-btn-ok"
                  onClick={() => void onAnswer()}
                >
                  قبول
                </button>
                <button
                  type="button"
                  className="call-btn call-btn-danger"
                  onClick={() => void onReject()}
                >
                  رفض
                </button>
              </div>
            ) : null}

            {(callStatus === 'dialing' || callStatus === 'ringing') && (
              <div className="call-actions">
                <button
                  type="button"
                  className="call-btn call-btn-danger"
                  onClick={() => void onHangup()}
                >
                  إلغاء
                </button>
              </div>
            )}

            {!inCall ? (
              <>
                <h2>طلب اتصال</h2>
                <label className="call-field">
                  رقم الطرف الآخر
                  <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="1002"
                    inputMode="tel"
                  />
                </label>
                <div className="call-dialpad">
                  {DIAL_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => pressDial(key)}
                    >
                      {key}
                    </button>
                  ))}
                </div>
                <div className="call-actions">
                  <button
                    type="button"
                    className="call-btn call-btn-ghost"
                    onClick={() => setDestination((v) => v.slice(0, -1))}
                  >
                    ⌫
                  </button>
                  <button
                    type="button"
                    className="call-btn call-btn-primary"
                    disabled={busy || !destination.trim()}
                    onClick={() => void onDial()}
                  >
                    اتصال
                  </button>
                </div>
              </>
            ) : null}
          </section>
        ) : null}

        {error ? <p className="call-error">{error}</p> : null}

        <p className="call-hint" style={{ textAlign: 'center' }}>
          الخادم:{' '}
          <span dir="ltr">{config?.sipDomain ?? '…'}</span> · الإشارة:{' '}
          <span dir="ltr">{config?.wssUrl ?? '…'}</span>
        </p>
      </div>

      <audio ref={remoteAudioRef} autoPlay playsInline />
    </div>
  );
}
