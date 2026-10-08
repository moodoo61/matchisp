import { createHmac, timingSafeEqual } from 'crypto';
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaLiveService } from '../../../../database/database.module';
import { VIEWING_PAGE_META_KEY } from '../../client_live/constants/viewing-page';
import { MistServerClient } from './mist-server.client';

/** معرّف JWK المشاهدة في Mist */
export const VIEWER_JWK_KID = 'match-viewer';
const LEGACY_VIEWER_JWK_KIDS = ['match-viewer', 'mv'] as const;
/** مشغّل حماية المشاهدة USER_NEW */
export const DENY_SCRIPT_NAME = 'mist-deny-playback.sh';

type CachedViewerToken = { token: string; expMs: number };
type MistTriggerObject = {
  handler: string;
  sync?: boolean;
  streams?: string[];
  default?: string;
};

/**
 * حماية مشاهدة: JWK + JWT (tkn) + مشغّل USER_NEW على قنوات اللوحة.
 * @see https://docs.mistserver.org/mistserver/integration/jwt/
 * @see https://docs.mistserver.org/mistserver/integration/triggers/list/USER_NEW
 */
@Injectable()
export class MistJwtService {
  private readonly logger = new Logger(MistJwtService.name);
  private readonly tokenCache = new Map<string, CachedViewerToken>();

  constructor(
    private readonly config: ConfigService,
    private readonly mist: MistServerClient,
    private readonly prisma: PrismaLiveService,
  ) {}

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

  /** JWT مشاهدة للقناة (sub = اسم الستريم) */
  signViewerToken(streamName: string): string {
    const name = streamName.trim();
    if (!name) return '';

    const now = Date.now();
    const cached = this.tokenCache.get(name);
    if (cached && cached.expMs - now > 60_000) {
      return cached.token;
    }

    const ttl = this.ttlSeconds();
    const exp = Math.floor(now / 1000) + ttl;
    const token = signHs256Jwt(
      { alg: 'HS256', typ: 'JWT', kid: VIEWER_JWK_KID },
      { sub: name, exp },
      this.secret(),
    );
    this.tokenCache.set(name, { token, expMs: now + ttl * 1000 });
    return token;
  }

  async ensureViewerProtection(): Promise<void> {
    const streams = await this.listProtectedStreamNames();
    if (!streams.length) {
      throw new ServiceUnavailableException(
        'لا توجد قنوات لتطبيق حماية المشاهدة عليها — أضف قناة أولاً',
      );
    }
    this.writeSecretFile();
    await this.ensureViewerJwk(streams);
    await this.ensureDenyPlaybackTrigger(streams);
  }

  async removeViewerProtection(): Promise<void> {
    await this.removeDenyPlaybackTrigger();
    await this.removeViewerJwks();
    this.tokenCache.clear();
  }

  async syncViewerProtectionIfEnabled(): Promise<void> {
    if (!(await this.isProtectionEnabled())) return;
    if (!this.mist.enabled()) return;
    try {
      await this.ensureViewerProtection();
    } catch (err) {
      this.logger.warn(
        `تعذر مزامنة حماية المشاهدة: ${
          err instanceof Error ? err.message : err
        }`,
      );
    }
  }

  /** هل حماية المشاهدة مفعّلة في إعدادات اللوحة */
  async isProtectionEnabled(): Promise<boolean> {
    const row = await this.prisma.sectionMeta.findUnique({
      where: { key: VIEWING_PAGE_META_KEY },
    });
    if (!row?.value) return false;
    try {
      const parsed = JSON.parse(row.value) as { jwtPlaybackEnabled?: unknown };
      return parsed.jwtPlaybackEnabled === true;
    } catch {
      return false;
    }
  }

  /** هل يوجد JWK المشاهدة في Mist */
  async verifyViewerJwkPresent(): Promise<boolean> {
    if (!this.mist.enabled()) return false;
    if (!(await this.isProtectionEnabled())) return false;
    try {
      const data = await this.mist.request({ jwks: true });
      return jwkListContainsKid(data.jwks, VIEWER_JWK_KID);
    } catch {
      return false;
    }
  }

  /** هل مشغّل USER_NEW الخاص بالحماية موجود في Mist */
  async verifyUserNewPresent(): Promise<boolean> {
    if (!this.mist.enabled()) return false;
    if (!(await this.isProtectionEnabled())) return false;
    try {
      const triggers = await this.mist.readTriggers();
      return listTriggerHandlers(triggers.USER_NEW).some((row) =>
        isOurDenyHandler(row),
      );
    } catch {
      return false;
    }
  }

  private async ensureViewerJwk(streams: string[]): Promise<void> {
    if (!this.mist.enabled()) {
      throw new ServiceUnavailableException('MistServer معطّل');
    }
    const secret = this.secret();
    const jwk = {
      kty: 'oct',
      alg: 'HS256',
      kid: VIEWER_JWK_KID,
      k: Buffer.from(secret, 'utf8').toString('base64url'),
      key_ops: ['sign', 'verify'],
    };
    const perms = {
      input: false,
      output: true,
      admin: false,
      stream: streams,
    };
    const result = await this.mist.request({
      addjwks: [[jwk, perms]],
    });
    this.logger.log(
      `JWK مشاهدة (${VIEWER_JWK_KID}) على ${streams.length} قناة — addjwks=${
        result.addjwks != null ? 'ok' : 'done'
      }`,
    );
  }

  /**
   * مشغّل USER_NEW blocking على قنوات اللوحة.
   * @see https://docs.mistserver.org/mistserver/integration/triggers/list/USER_NEW
   */
  private async ensureDenyPlaybackTrigger(streams: string[]): Promise<void> {
    const handler = this.denyScriptPath();
    if (!existsSync(handler)) {
      throw new ServiceUnavailableException(
        `ملف حظر المشاهدة غير موجود: ${handler}`,
      );
    }
    chmodSync(handler, 0o755);
    const py = handler.replace(/\.sh$/i, '.py');
    if (existsSync(py)) chmodSync(py, 0o755);

    await this.mist.updateTriggers((current) => {
      const existing = listTriggerHandlers(current.USER_NEW);
      const others = existing.filter((row) => !isOurDenyHandler(row));
      const ours: MistTriggerObject = {
        handler,
        sync: true,
        streams,
        default: '0',
      };
      return { ...current, USER_NEW: [...others, ours] };
    });
    this.logger.log(
      `USER_NEW حماية المشاهدة → ${handler} (${streams.length} قناة)`,
    );
  }

  private async removeViewerJwks(): Promise<void> {
    if (!this.mist.enabled()) return;
    try {
      await this.mist.request({
        deletejwks: LEGACY_VIEWER_JWK_KIDS.map((kid) => ({ kid })),
      });
    } catch (err) {
      this.logger.warn(
        `تعذر حذف JWK المشاهدة: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  private writeSecretFile() {
    const path = this.secretFilePath();
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${this.secret()}\n`, { encoding: 'utf8', mode: 0o600 });
    chmodSync(path, 0o600);
  }

  private secretFilePath(): string {
    const override = this.config.get<string>('MIST_VIEWER_SECRET_FILE')?.trim();
    if (override) return override;
    return '/opt/match/var/live/mist-viewer.secret';
  }

  private denyScriptPath(): string {
    const override = this.config
      .get<string>('MIST_DENY_PLAYBACK_SCRIPT')
      ?.trim();
    if (override) return override;
    const candidates = [
      '/opt/match/scripts/mist-deny-playback.sh',
      join(process.cwd(), 'scripts', DENY_SCRIPT_NAME),
      join(process.cwd(), '../../scripts', DENY_SCRIPT_NAME),
    ];
    return candidates.find((path) => existsSync(path)) ?? candidates[0];
  }

  private async removeDenyPlaybackTrigger(): Promise<void> {
    if (!this.mist.enabled()) return;
    try {
      await this.mist.updateTriggers((current) => {
        const existing = listTriggerHandlers(current.USER_NEW);
        const hasOurs = existing.some((row) => isOurDenyHandler(row));
        if (!hasOurs) return null;
        const rows = existing.filter((row) => !isOurDenyHandler(row));
        const next = { ...current };
        if (rows.length) next.USER_NEW = rows;
        else delete next.USER_NEW;
        return next;
      });
    } catch (err) {
      this.logger.warn(
        `تعذر إزالة مشغّل USER_NEW: ${
          err instanceof Error ? err.message : err
        }`,
      );
    }
  }

  private async listProtectedStreamNames(): Promise<string[]> {
    const rows = await this.prisma.channel.findMany({
      where: { isActive: true },
      select: { name: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return [
      ...new Set(
        rows.map((row) => row.name.trim()).filter((name) => name.length > 0),
      ),
    ];
  }
}

function signHs256Jwt(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  secret: string,
): string {
  const h = Buffer.from(JSON.stringify(header)).toString('base64url');
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const data = `${h}.${p}`;
  const sig = createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

/** للاختبارات الداخلية */
export function verifyViewerTokenForTests(
  stream: string,
  token: string,
  secret: string,
): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [h, p, s] = parts;
    const expect = createHmac('sha256', secret)
      .update(`${h}.${p}`)
      .digest('base64url');
    const a = Buffer.from(s);
    const b = Buffer.from(expect);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    const payload = JSON.parse(
      Buffer.from(p, 'base64url').toString('utf8'),
    ) as { sub?: string; exp?: number };
    const now = Math.floor(Date.now() / 1000);
    if (payload.sub !== stream) return false;
    if (typeof payload.exp !== 'number' || payload.exp < now) return false;
    return true;
  } catch {
    return false;
  }
}

function jwkListContainsKid(jwks: unknown, kid: string): boolean {
  const stack: unknown[] = [jwks];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur) continue;
    if (Array.isArray(cur)) {
      for (const item of cur) stack.push(item);
      continue;
    }
    if (typeof cur === 'object') {
      const obj = cur as { kid?: unknown; keys?: unknown };
      if (obj.kid === kid) return true;
      if (obj.keys) stack.push(obj.keys);
    }
  }
  return false;
}

function listTriggerHandlers(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];
  if (typeof value[0] === 'string') return [value];
  return value.filter((row) => {
    if (Array.isArray(row) && typeof row[0] === 'string') return true;
    if (row && typeof row === 'object' && !Array.isArray(row)) {
      return typeof (row as MistTriggerObject).handler === 'string';
    }
    return false;
  });
}

function handlerPathOf(row: unknown): string | null {
  if (typeof row === 'string') return row;
  if (Array.isArray(row) && typeof row[0] === 'string') return row[0];
  if (row && typeof row === 'object' && !Array.isArray(row)) {
    const handler = (row as MistTriggerObject).handler;
    return typeof handler === 'string' ? handler : null;
  }
  return null;
}

function isOurDenyHandler(row: unknown): boolean {
  const handler = handlerPathOf(row);
  if (!handler) return false;
  return (
    handler === DENY_SCRIPT_NAME ||
    handler.endsWith(`/${DENY_SCRIPT_NAME}`) ||
    handler.endsWith(`\\${DENY_SCRIPT_NAME}`)
  );
}
