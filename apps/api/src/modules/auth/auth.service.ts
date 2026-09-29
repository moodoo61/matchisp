import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { compare } from 'bcrypt';
import type { AuthUser, LoginResponse } from '@isp/shared';
import { PrismaCoreService } from '../../database/database.module';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaCoreService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async buildAuthUser(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      isActive: user.status === 'ACTIVE',
      roles: user.roles.map((ur) => ur.role.code),
      permissions: [
        ...new Set(
          user.roles.flatMap((ur) =>
            ur.role.permissions.map((rp) => rp.permission.code),
          ),
        ),
      ],
    };
  }

  private async issueTokens(userId: string, username: string, meta?: {
    ipAddress?: string;
    userAgent?: string;
  }) {
    // jti يضمن تفرد JWT حتى لو صدر أكثر من توكن في نفس الثانية
    const accessToken = await this.jwt.signAsync(
      { sub: userId, username, jti: randomUUID() },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_TTL') ?? '15m',
      },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, username, typ: 'refresh', jti: randomUUID() },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_TTL') ?? '7d',
      },
    );

    const ttl = this.config.get<string>('JWT_REFRESH_TTL') ?? '7d';
    const days = ttl.endsWith('d') ? Number(ttl.replace('d', '')) : 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
    });

    return { accessToken, refreshToken };
  }

  async login(
    username: string,
    password: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const tokens = await this.issueTokens(user.id, user.username, meta);
    const authUser = await this.buildAuthUser(user.id);

    await this.audit.log({
      actorId: user.id,
      action: 'login',
      resource: 'auth',
      resourceId: user.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return { user: authUser, tokens };
  }

  async refresh(
    refreshToken: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<LoginResponse> {
    let payload: { sub: string; username: string; typ?: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('رمز التحديث غير صالح');
    }

    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('رمز التحديث غير صالح');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(refreshToken) },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('رمز التحديث منتهي أو ملغى');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new ForbiddenException('الحساب غير نشط');
    }

    const tokens = await this.issueTokens(user.id, user.username, meta);
    const authUser = await this.buildAuthUser(user.id);
    return { user: authUser, tokens };
  }

  async logout(refreshToken: string | undefined, actorId?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: this.hashToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    if (actorId) {
      await this.audit.log({
        actorId,
        action: 'logout',
        resource: 'auth',
        resourceId: actorId,
      });
    }

    return { success: true };
  }

  async me(userId: string): Promise<AuthUser> {
    return this.buildAuthUser(userId);
  }
}
