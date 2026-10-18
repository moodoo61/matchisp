import {
  Invitation,
  Inviter,
  Registerer,
  RegistererState,
  Session,
  SessionState,
  UserAgent,
  type SessionDescriptionHandler,
} from 'sip.js';
import type { CallStatus, RegStatus } from '../types';

export type SoftphoneCallbacks = {
  onRegStatus: (status: RegStatus, detail?: string) => void;
  onCallStatus: (status: CallStatus, detail?: string) => void;
  onRemoteStream: (stream: MediaStream | null) => void;
  onIncoming: (from: string) => void;
};

type MediaSdh = SessionDescriptionHandler & {
  peerConnection?: RTCPeerConnection;
};

export class Softphone {
  private ua: UserAgent | null = null;
  private registerer: Registerer | null = null;
  private session: Session | null = null;
  private muted = false;
  private extension = '';

  constructor(
    private readonly wssUrl: string,
    private readonly sipDomain: string,
    private readonly cb: SoftphoneCallbacks,
  ) {}

  get isRegistered() {
    return this.registerer?.state === RegistererState.Registered;
  }

  get currentExtension() {
    return this.extension;
  }

  async register(extension: string, password: string): Promise<void> {
    await this.disconnect();
    this.extension = extension.trim();
    this.cb.onRegStatus('connecting');

    const uri = UserAgent.makeURI(`sip:${this.extension}@${this.sipDomain}`);
    if (!uri) {
      this.cb.onRegStatus('failed', 'معرف SIP غير صالح');
      throw new Error('معرف SIP غير صالح');
    }

    this.ua = new UserAgent({
      uri,
      transportOptions: {
        server: this.wssUrl,
      },
      authorizationUsername: this.extension,
      authorizationPassword: password,
      displayName: this.extension,
      sessionDescriptionHandlerFactoryOptions: {
        constraints: { audio: true, video: false },
        peerConnectionConfiguration: {
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        },
      },
      delegate: {
        onInvite: (invitation) => this.handleIncoming(invitation),
      },
    });

    try {
      await this.ua.start();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'تعذر الاتصال بخادم الإشارة';
      this.cb.onRegStatus('failed', msg);
      throw err;
    }

    this.registerer = new Registerer(this.ua);
    this.registerer.stateChange.addListener((state) => {
      switch (state) {
        case RegistererState.Registered:
          this.cb.onRegStatus('registered');
          break;
        case RegistererState.Unregistered:
          this.cb.onRegStatus('unregistered');
          break;
        case RegistererState.Terminated:
          this.cb.onRegStatus('unregistered');
          break;
        default:
          break;
      }
    });

    try {
      await this.registerer.register();
      this.cb.onRegStatus('registered');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'فشل تسجيل الرقم على المقسم';
      this.cb.onRegStatus('failed', msg);
      throw err;
    }
  }

  async dial(destination: string): Promise<void> {
    if (!this.ua || !this.isRegistered) {
      throw new Error('سجّل الرقم أولاً');
    }
    if (this.session) {
      throw new Error('هناك مكالمة جارية');
    }
    const dest = destination.trim();
    if (!dest) throw new Error('أدخل رقم الوجهة');

    const target = UserAgent.makeURI(`sip:${dest}@${this.sipDomain}`);
    if (!target) throw new Error('رقم الوجهة غير صالح');

    const inviter = new Inviter(this.ua, target, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
    });
    this.attachSession(inviter);
    this.cb.onCallStatus('dialing', dest);
    try {
      await inviter.invite();
    } catch (err) {
      this.session = null;
      this.cb.onCallStatus(
        'failed',
        err instanceof Error ? err.message : 'فشل الطلب',
      );
      throw err;
    }
  }

  async answer(): Promise<void> {
    if (!(this.session instanceof Invitation)) {
      throw new Error('لا توجد مكالمة واردة');
    }
    await this.session.accept({
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
    });
    this.cb.onCallStatus('active');
  }

  async reject(): Promise<void> {
    if (this.session instanceof Invitation) {
      await this.session.reject();
    }
    this.clearSession();
    this.cb.onCallStatus('ended');
  }

  async hangup(): Promise<void> {
    if (!this.session) return;
    const s = this.session;
    try {
      switch (s.state) {
        case SessionState.Initial:
        case SessionState.Establishing:
          if (s instanceof Inviter) await s.cancel();
          else if (s instanceof Invitation) await s.reject();
          break;
        case SessionState.Established:
          await s.bye();
          break;
        default:
          break;
      }
    } catch {
      /* ignore */
    }
    this.clearSession();
    this.cb.onCallStatus('ended');
  }

  setMuted(mute: boolean) {
    this.muted = mute;
    const pc = this.getPeerConnection();
    if (!pc) return;
    for (const sender of pc.getSenders()) {
      if (sender.track?.kind === 'audio') {
        sender.track.enabled = !mute;
      }
    }
  }

  getMuted() {
    return this.muted;
  }

  /** @param opts.unregister عند false يُغلق الاتصال دون إلغاء التسجيل على المقسم (تحديث الصفحة). */
  async disconnect(opts?: { unregister?: boolean }): Promise<void> {
    const doUnregister = opts?.unregister !== false;
    try {
      await this.hangup();
    } catch {
      /* ignore */
    }
    // إلغاء التسجيل اختياري — تجاهل 401/الرفض الشائع عند الإغلاق
    if (doUnregister) {
      try {
        if (
          this.registerer &&
          this.registerer.state === RegistererState.Registered
        ) {
          await this.registerer.unregister().catch(() => undefined);
        }
      } catch {
        /* ignore */
      }
    }
    try {
      if (this.ua) await this.ua.stop();
    } catch {
      /* ignore */
    }
    this.registerer = null;
    this.ua = null;
    this.extension = '';
    this.cb.onRegStatus('idle');
    this.cb.onRemoteStream(null);
  }

  private handleIncoming(invitation: Invitation) {
    if (this.session) {
      void invitation.reject();
      return;
    }
    this.attachSession(invitation);
    const from =
      invitation.remoteIdentity?.uri?.user ||
      invitation.remoteIdentity?.displayName ||
      'وارد';
    this.cb.onIncoming(from);
    this.cb.onCallStatus('incoming', from);
  }

  private attachSession(session: Session) {
    this.session = session;
    this.muted = false;
    session.stateChange.addListener((state) => {
      switch (state) {
        case SessionState.Establishing:
          if (session instanceof Inviter) this.cb.onCallStatus('ringing');
          break;
        case SessionState.Established:
          this.cb.onCallStatus('active');
          this.bindRemoteAudio(session);
          break;
        case SessionState.Terminated:
          this.clearSession();
          this.cb.onCallStatus('ended');
          this.cb.onRemoteStream(null);
          break;
        default:
          break;
      }
    });
  }

  private bindRemoteAudio(session: Session) {
    const pc = this.getPeerConnection(session);
    if (!pc) return;

    const apply = () => {
      const tracks = pc
        .getReceivers()
        .map((r) => r.track)
        .filter((t): t is MediaStreamTrack => !!t && t.kind === 'audio');
      this.cb.onRemoteStream(tracks.length ? new MediaStream(tracks) : null);
    };

    apply();
    pc.addEventListener('track', () => apply());
  }

  private getPeerConnection(session?: Session): RTCPeerConnection | null {
    const s = session ?? this.session;
    const sdh = s?.sessionDescriptionHandler as MediaSdh | undefined;
    return sdh?.peerConnection ?? null;
  }

  private clearSession() {
    this.session = null;
    this.muted = false;
  }
}

/** يُستدعى من المتصفح فقط (بعد mount) لتجنب اختلاف SSR/العميل. */
export function resolveCallConfig(): { wssUrl: string; sipDomain: string } {
  const host = window.location.hostname;
  const isHttps = window.location.protocol === 'https:';
  // عبر nginx HTTPS: نفس المضيف /ws → Asterisk
  // عبر HTTP مباشر: منفذ Asterisk 8088
  const wssUrl =
    process.env.NEXT_PUBLIC_ASTERISK_WSS_URL?.trim() ||
    (isHttps ? `wss://${host}/ws` : `ws://${host}:8088/ws`);
  const sipDomain =
    process.env.NEXT_PUBLIC_ASTERISK_SIP_DOMAIN?.trim() || host;
  return { wssUrl, sipDomain };
}

export function isCallSecureContext(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext === true;
}

export function secureContextMessage(): string {
  const host = window.location.hostname;
  const isLocal =
    host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  if (window.isSecureContext) return '';
  if (isLocal) {
    return 'افتح الصفحة عبر http://127.0.0.1 أو https لتمكين الميكروفون.';
  }
  return (
    'المتصفح يمنع الميكروفون على HTTP لهذا المضيف. ' +
    `افتح الصفحة عبر HTTPS مثل: https://${host}/call`
  );
}
