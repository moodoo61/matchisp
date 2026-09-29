import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaCoreService } from '../../database/database.module';
import type { RequestUser } from '../../common/guards';

type JwtPayload = {
  sub: string;
  username: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaCoreService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('الحساب غير نشط');
    }

    const roles = user.roles.map((ur) => ur.role.code);
    const permissions = [
      ...new Set(
        user.roles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.code),
        ),
      ),
    ];

    return {
      id: user.id,
      username: user.username,
      roles,
      permissions,
    };
  }
}
