import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  ForbiddenException,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { hasPermission, type PermissionCode } from '@isp/shared';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const PERMISSIONS_ANY_KEY = 'permissions_any';
export const RequireAnyPermission = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_ANY_KEY, permissions);

export type RequestUser = {
  id: string;
  username: string;
  permissions: string[];
  roles: string[];
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest<{ user: RequestUser }>();
    return request.user;
  },
);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser>(err: Error | null, user: TUser): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException('غير مصرح');
    }
    return user;
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAll = this.reflector.getAllAndOverride<PermissionCode[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredAny = this.reflector.getAllAndOverride<PermissionCode[]>(
      PERMISSIONS_ANY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (
      (!requiredAll || requiredAll.length === 0) &&
      (!requiredAny || requiredAny.length === 0)
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('غير مصرح');
    }

    if (requiredAll?.length) {
      const ok = requiredAll.every((permission) =>
        hasPermission(user.permissions, permission),
      );
      if (!ok) {
        throw new ForbiddenException('لا تملك الصلاحية المطلوبة');
      }
    }

    if (requiredAny?.length) {
      const ok = requiredAny.some((permission) =>
        hasPermission(user.permissions, permission),
      );
      if (!ok) {
        throw new ForbiddenException('لا تملك الصلاحية المطلوبة');
      }
    }

    return true;
  }
}
