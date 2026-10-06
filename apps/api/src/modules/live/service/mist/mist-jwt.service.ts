import { chmodSync, existsSync } from 'fs';
import { join } from 'path';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MistServerClient } from './mist-server.client';

/** معرّف مفتاح المشاهدة في Mist — للحذف/التحديث */
export const MIST_VIEWER_JWK_KID = 'match-viewer';

/**
 * صلاحيات JWK حسب دليل Mist:
 * input = دفع البث (Use keys to permit stream input) — نُبقيه معطّلاً
 * output = مشاهدة البث — هذا ما نحتاجه
 * admin = مصادقة واجهة الـ API — غير مطلوب وغير فعّال حالياً
 * @see https://docs.mistserver.org/howto/integration/howtojwt
 */
const VIEWER_JWK_PERMS = {
  input: false,
  output: true,
  admin: false,
} as const;

/**
 * توقيع JWT لمشاهدة MistServer (takers) ومزامنة JWK.
 * @see https://docs.mistserver.org/mistserver/integration/jwt
 */
type CachedViewerToken = { token: string; expMs: number };

@Injectable()
export class MistJwtService {
  private readonly logger = new Logger(MistJwtService.name);
  /** كاش قصير لتفادي تغيّر رابط HLS في كل استطلاع للواجهة */
  private readonly tokenCache = new Map<string, CachedViewerToken>();

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly mist: MistServerClient,
  ) {}

  /** سر التوقيع — MIST_JWT_SECRET أو مشتق من JWT_ACCESS_SECRET */
  secret(): string {
    const dedicated = this.config.get<string>('MIST_JWT_SECRET')?.trim();
    if (dedicated) return dedicated;
    const access = this.config.get<string>('JWT_ACCESS_SECRET')?.trim();
    if (access) return `${access}:mist-viewer-jwk`;
    return 'dev-mist-viewer-secret-change-me';
  }

  ttlSeconds(): number {
    const raw = Number(this.config.get<string>('MIST_JWT_TTL_SECONDS') ?? '300');
    if (!Number.isFinite(raw) || raw < 30) return 300;
    if (raw > 3600) return 3600;
    return Math.round(raw);
  }

  /** يوقّع توكن مشاهدة لتيار واحد (sub = اسم القناة) — يعيد استخدامه حتى قرب انتهاء الصلاحية */
  signViewerToken(streamName: string): string {
    const name = streamName.trim();
    if (!name) return '';

    const now = Date.now();
    const cached = this.tokenCache.get(name);
    if (cached && cached.expMs - now > 60_000) {
      return cached.token;
    }

    const ttl = this.ttlSeconds();
    const token = this.jwt.sign(
      { sub: name },
      {
        secret: this.secret(),
        algorithm: 'HS256',
        expiresIn: ttl,
        keyid: MIST_VIEWER_JWK_KID,
      },
    );
    this.tokenCache.set(name, { token, expMs: now + ttl * 1000 });
    return token;
  }

  /**
   * يفعّل حماية المشاهدة: مفتاح مشاهدة فقط + حظر المشاهدة المفتوحة.
   * إضافة JWK وحدها لا تمنع الرابط بدون توكن؛ Mist يتجاوز الحظر فقط عند صحة JWT.
   * @see https://docs.mistserver.org/howto/integration/howtojwt
   */
  async ensureViewerProtection(): Promise<void> {
    await this.ensureViewerJwk();
    await this.ensureDenyPlaybackTrigger();
  }

  /** يعيد المشاهدة المفتوحة: يحذف المفتاح ومشغّل الرفض */
  async removeViewerProtection(): Promise<void> {
    await this.removeViewerJwk();
    await this.removeDenyPlaybackTrigger();
  }

  /** يضيف/يحدّث JWK للمشاهدة فقط (output) دون إدخال بث أو مصادقة API */
  async ensureViewerJwk(): Promise<void> {
    if (!this.mist.enabled()) {
      throw new ServiceUnavailableException(
        'MistServer معطّل — تعذر تفعيل حماية JWT',
      );
    }
    const k = Buffer.from(this.secret(), 'utf8').toString('base64url');
    try {
      await this.mist.request({
        addjwks: [
          {
            kty: 'oct',
            alg: 'HS256',
            k,
            kid: MIST_VIEWER_JWK_KID,
            key_ops: ['sign', 'verify'],
          },
          VIEWER_JWK_PERMS,
        ],
      });
      this.logger.log(
        `تم تسجيل JWK مشاهدة في Mist kid=${MIST_VIEWER_JWK_KID} (output فقط)`,
      );
    } catch (err) {
      this.logger.error(
        `فشل تسجيل JWK في Mist: ${err instanceof Error ? err.message : err}`,
      );
      throw new ServiceUnavailableException(
        'تعذر تسجيل مفتاح JWT في MistServer — تحقق من الإصدار (≥3.9) والاتصال',
      );
    }
  }

  /** يزيل JWK المشاهدة من MistServer لإعادة الوضع المفتوح */
  async removeViewerJwk(): Promise<void> {
    if (!this.mist.enabled()) return;
    try {
      await this.mist.request({
        deletejwks: [MIST_VIEWER_JWK_KID],
      });
      this.logger.log(`تم حذف JWK مشاهدة من Mist kid=${MIST_VIEWER_JWK_KID}`);
    } catch (err) {
      this.logger.warn(
        `تعذر حذف JWK من Mist: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  /**
   * USER_NEW حاجب يرد false لكل مشاهدة عادية.
   * التوكن الصالح يتجاوز المشغّلات حسب توثيق Mist.
   */
  private async ensureDenyPlaybackTrigger(): Promise<void> {
    const handler = this.denyScriptPath();
    chmodSync(handler, 0o755);
    const current = await this.readTriggers();
    const rows = triggerRows(current.USER_NEW).filter(
      (row) => row[0] !== handler,
    );
    // false = blocking حتى تُستخدم استجابة السكربت
    rows.push([handler, false, []]);
    await this.mist.request({
      config: { triggers: { ...current, USER_NEW: rows } },
    });
    this.logger.log(`تم تفعيل حظر المشاهدة المفتوحة عبر USER_NEW (${handler})`);
  }

  private async removeDenyPlaybackTrigger(): Promise<void> {
    if (!this.mist.enabled()) return;
    const handler = this.denyScriptPath();
    try {
      const current = await this.readTriggers();
      const rows = triggerRows(current.USER_NEW).filter(
        (row) => row[0] !== handler,
      );
      const next = { ...current };
      if (rows.length) next.USER_NEW = rows;
      else delete next.USER_NEW;
      await this.mist.request({ config: { triggers: next } });
      this.logger.log('تم إزالة حظر المشاهدة المفتوحة من Mist');
    } catch (err) {
      this.logger.warn(
        `تعذر إزالة مشغّل USER_NEW: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  private denyScriptPath(): string {
    const override = this.config.get<string>('MIST_DENY_PLAYBACK_SCRIPT')?.trim();
    if (override) return override;
    const candidates = [
      join(process.cwd(), 'scripts/mist-deny-playback.sh'),
      join(process.cwd(), '../../scripts/mist-deny-playback.sh'),
      '/opt/match/scripts/mist-deny-playback.sh',
    ];
    return candidates.find((path) => existsSync(path)) ?? candidates[2];
  }

  private async readTriggers(): Promise<Record<string, unknown>> {
    const data = await this.mist.request({ config: true });
    const triggers = data.config?.triggers;
    if (!triggers || typeof triggers !== 'object' || Array.isArray(triggers)) {
      return {};
    }
    return { ...triggers };
  }
}

function triggerRows(value: unknown): unknown[][] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is unknown[] => Array.isArray(row));
}
