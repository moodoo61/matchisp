import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaNetworkPagesService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { UpdateLoginExternalAuthDto } from '../dto/update-login-external-auth.dto';
import { ExternalAuthLoginDto } from '../dto/external-auth-login.dto';

const DEFAULT_ID = 'default';

type UmUser = {
  name?: string;
  password?: string;
  disabled?: string | boolean;
};

@Injectable()
export class LoginExternalAuthService {
  constructor(
    private readonly prisma: PrismaNetworkPagesService,
    private readonly audit: AuditService,
  ) {}

  async get() {
    const row = await this.ensureRow();
    return this.toAdminDto(row);
  }

  /** للاستجابة العامة — بدون أسرار */
  async getPublic() {
    const s = await this.ensureRow();
    if (!s.enabled) return { enabled: false };

    const mode =
      s.flowMode === 'redirect' ? ('redirect' as const) : ('credentials' as const);

    if (mode === 'redirect') {
      if (!s.remoteUrl.trim()) return { enabled: false };
      return {
        enabled: true,
        mode,
        remoteUrl: s.remoteUrl.trim(),
        httpMethod: s.httpMethod === 'get' ? 'get' : 'post',
        linkLabel: s.linkLabel.trim() || 'الدخول كمشترك',
        fields: {
          mac: s.sendMac,
          ip: s.sendIp,
          username: s.sendUsername,
          linkLogin: s.sendLinkLogin,
          linkOrig: s.sendLinkOrig,
          error: s.sendError,
        },
      };
    }

    if (!s.restBaseUrl.trim() || !s.restUsername.trim()) {
      return { enabled: false };
    }

    const loginUrl = this.publicLoginUrl();
    return {
      enabled: true,
      mode,
      loginUrl,
      linkLabel: s.linkLabel.trim() || 'الدخول كمشترك',
    };
  }

  /**
   * تحقق من المشترك عبر User Manager REST ثم صفحة HTML تعيد POST لـ link-login
   * (نمط MikroTik External auth — Match كبوابة وسيطة)
   */
  async loginAndBuildReturnHtml(dto: ExternalAuthLoginDto) {
    const s = await this.ensureRow();
    if (!s.enabled || s.flowMode === 'redirect') {
      throw new BadRequestException('المصادقة بالبيانات غير مفعّلة');
    }
    if (!s.restBaseUrl.trim() || !s.restUsername.trim()) {
      throw new BadRequestException('إعدادات REST غير مكتملة');
    }

    const username = dto.username.trim();
    const password = dto.password;
    const linkLogin = dto.linkLogin.trim();
    if (!/^https?:\/\//i.test(linkLogin)) {
      throw new BadRequestException('link-login غير صالح');
    }

    const ok = await this.verifyUmUser(s, username, password);
    if (!ok) {
      throw new UnauthorizedException('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    const dst = (dto.linkOrig || '').trim() || linkLogin;
    return this.buildReturnHtml({
      linkLogin,
      username,
      password,
      dst,
    });
  }

  async update(dto: UpdateLoginExternalAuthDto, actorId: string) {
    const current = await this.ensureRow();
    const flowMode =
      dto.flowMode !== undefined
        ? dto.flowMode
        : current.flowMode === 'redirect'
          ? 'redirect'
          : 'credentials';
    const willEnable =
      dto.enabled !== undefined ? dto.enabled : current.enabled;

    const remoteUrl =
      dto.remoteUrl !== undefined ? dto.remoteUrl.trim() : undefined;
    const restBaseUrl =
      dto.restBaseUrl !== undefined ? dto.restBaseUrl.trim() : undefined;

    if (willEnable && flowMode === 'redirect') {
      const url = remoteUrl ?? current.remoteUrl.trim();
      if (!url || !/^https?:\/\//i.test(url)) {
        throw new BadRequestException(
          'عنوان البوابة مطلوب لنمط التوجيه (http/https)',
        );
      }
    }
    if (willEnable && flowMode === 'credentials') {
      const base = restBaseUrl ?? current.restBaseUrl.trim();
      const user =
        dto.restUsername !== undefined
          ? dto.restUsername.trim()
          : current.restUsername.trim();
      const pass =
        dto.restPassword !== undefined
          ? dto.restPassword
          : current.restPassword;
      if (!base || !/^https?:\/\//i.test(base)) {
        throw new BadRequestException(
          'عنوان REST (مثل http://host:1616) مطلوب لنمط البيانات',
        );
      }
      if (!user || !pass) {
        throw new BadRequestException(
          'مستخدم وكلمة مرور API على CHR مطلوبان',
        );
      }
    }

    const item = await this.prisma.loginExternalAuthSettings.update({
      where: { id: DEFAULT_ID },
      data: {
        ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
        ...(dto.flowMode !== undefined ? { flowMode: dto.flowMode } : {}),
        ...(remoteUrl !== undefined ? { remoteUrl } : {}),
        ...(dto.httpMethod !== undefined
          ? { httpMethod: dto.httpMethod }
          : {}),
        ...(restBaseUrl !== undefined ? { restBaseUrl } : {}),
        ...(dto.restUsername !== undefined
          ? { restUsername: dto.restUsername.trim() }
          : {}),
        ...(dto.restPassword !== undefined
          ? { restPassword: dto.restPassword }
          : {}),
        ...(dto.linkLabel !== undefined
          ? { linkLabel: dto.linkLabel.trim() || 'الدخول كمشترك' }
          : {}),
        ...(dto.sendMac !== undefined ? { sendMac: dto.sendMac } : {}),
        ...(dto.sendIp !== undefined ? { sendIp: dto.sendIp } : {}),
        ...(dto.sendUsername !== undefined
          ? { sendUsername: dto.sendUsername }
          : {}),
        ...(dto.sendLinkLogin !== undefined
          ? { sendLinkLogin: dto.sendLinkLogin }
          : {}),
        ...(dto.sendLinkOrig !== undefined
          ? { sendLinkOrig: dto.sendLinkOrig }
          : {}),
        ...(dto.sendError !== undefined ? { sendError: dto.sendError } : {}),
      },
    });

    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'page_management.login.external_auth',
      resourceId: item.id,
      metadata: { flowMode: item.flowMode, enabled: item.enabled },
    });
    return this.toAdminDto(item);
  }

  private toAdminDto(row: {
    id: string;
    enabled: boolean;
    flowMode: string;
    remoteUrl: string;
    httpMethod: string;
    restBaseUrl: string;
    restUsername: string;
    restPassword: string;
    linkLabel: string;
    sendMac: boolean;
    sendIp: boolean;
    sendUsername: boolean;
    sendLinkLogin: boolean;
    sendLinkOrig: boolean;
    sendError: boolean;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      enabled: row.enabled,
      flowMode: row.flowMode === 'redirect' ? 'redirect' : 'credentials',
      remoteUrl: row.remoteUrl,
      httpMethod: row.httpMethod,
      restBaseUrl: row.restBaseUrl,
      restUsername: row.restUsername,
      /** لا نُرجع كلمة المرور؛ فقط هل مُعدّة */
      hasRestPassword: !!row.restPassword,
      linkLabel: row.linkLabel,
      sendMac: row.sendMac,
      sendIp: row.sendIp,
      sendUsername: row.sendUsername,
      sendLinkLogin: row.sendLinkLogin,
      sendLinkOrig: row.sendLinkOrig,
      sendError: row.sendError,
      updatedAt: row.updatedAt.toISOString(),
      publicLoginUrl: this.publicLoginUrl(),
    };
  }

  private publicLoginUrl() {
    const base = (
      process.env.API_URL ||
      process.env.PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      ''
    ).replace(/\/$/, '');
    const path = '/api/public/login/external-auth/login';
    return base ? `${base}${path}` : path;
  }

  private async verifyUmUser(
    s: { restBaseUrl: string; restUsername: string; restPassword: string },
    username: string,
    password: string,
  ): Promise<boolean> {
    const base = s.restBaseUrl.replace(/\/$/, '');
    const url = `${base}/rest/user-manager/user?name=${encodeURIComponent(username)}`;
    const auth = Buffer.from(
      `${s.restUsername}:${s.restPassword}`,
      'utf8',
    ).toString('base64');

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(12000),
      });
    } catch {
      throw new BadRequestException('تعذر الاتصال بخادم User Manager');
    }

    if (res.status === 401 || res.status === 403) {
      throw new BadRequestException('فشل دخول API على CHR — راجع بيانات REST');
    }
    if (!res.ok) {
      throw new BadRequestException(`خطأ User Manager: HTTP ${res.status}`);
    }

    const data = (await res.json()) as UmUser[] | UmUser;
    const list = Array.isArray(data) ? data : data ? [data] : [];
    const user = list.find((u) => u.name === username) ?? list[0];
    if (!user || user.name !== username) return false;
    if (user.disabled === true || user.disabled === 'true') return false;
    return String(user.password ?? '') === password;
  }

  private buildReturnHtml(opts: {
    linkLogin: string;
    username: string;
    password: string;
    dst: string;
  }) {
    const esc = (v: string) =>
      v
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><title>جاري الدخول…</title></head>
<body>
<p>تم التحقق — جاري فتح الجلسة على الراوتر…</p>
<form id="back" method="post" action="${esc(opts.linkLogin)}">
  <input type="hidden" name="username" value="${esc(opts.username)}">
  <input type="hidden" name="password" value="${esc(opts.password)}">
  <input type="hidden" name="dst" value="${esc(opts.dst)}">
  <input type="hidden" name="popup" value="true">
</form>
<script>document.getElementById('back').submit();</script>
</body>
</html>`;
  }

  private async ensureRow() {
    const existing = await this.prisma.loginExternalAuthSettings.findUnique({
      where: { id: DEFAULT_ID },
    });
    if (existing) return existing;
    return this.prisma.loginExternalAuthSettings.create({
      data: { id: DEFAULT_ID },
    });
  }
}
