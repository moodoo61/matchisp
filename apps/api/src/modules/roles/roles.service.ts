import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaCoreService } from '../../database/database.module';
import { AuditService } from '../audit/audit.service';
import { CreateRoleDto, UpdateRoleDto } from './roles.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaCoreService,
    private readonly audit: AuditService,
  ) {}

  listPermissions() {
    return this.prisma.permission.findMany({ orderBy: { code: 'asc' } });
  }

  async listRoles() {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      usersCount: role._count.users,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        code: rp.permission.code,
        name: rp.permission.name,
      })),
    }));
  }

  async create(dto: CreateRoleDto, actorId: string) {
    const existing = await this.prisma.role.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new ConflictException('رمز الدور مستخدم مسبقاً');

    const role = await this.prisma.role.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        permissions: dto.permissionIds?.length
          ? {
              create: dto.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: { permissions: { include: { permission: true } } },
    });

    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'roles',
      resourceId: role.id,
      metadata: { code: role.code },
    });

    return role;
  }

  async update(id: string, dto: UpdateRoleDto, actorId: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('الدور غير موجود');

    if (dto.permissionIds) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
      if (dto.permissionIds.length) {
        await this.prisma.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
      }
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
      include: { permissions: { include: { permission: true } } },
    });

    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'roles',
      resourceId: id,
    });

    return updated;
  }

  async remove(id: string, actorId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException('الدور غير موجود');
    if (role.isSystem) {
      throw new BadRequestException('لا يمكن حذف دور نظامي');
    }
    if (role._count.users > 0) {
      throw new BadRequestException('الدور مرتبط بمستخدمين');
    }

    await this.prisma.role.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'roles',
      resourceId: id,
      metadata: { code: role.code },
    });

    return { success: true };
  }
}
