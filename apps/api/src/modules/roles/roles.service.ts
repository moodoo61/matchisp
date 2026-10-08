import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ALL_PERMISSIONS, PERMISSION_LABELS } from '@isp/shared';
import { PrismaCoreService } from '../../database/database.module';
import { AuditService } from '../audit/audit.service';
import { CreateRoleDto, UpdateRoleDto } from './roles.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaCoreService,
    private readonly audit: AuditService,
  ) {}

  /** يضمن وجود كل صلاحيات النظام في القاعدة ثم يعيدها مرتّبة */
  async listPermissions() {
    await this.syncSystemPermissions();
    return this.prisma.permission.findMany({ orderBy: { code: 'asc' } });
  }

  private async syncSystemPermissions() {
    for (const code of ALL_PERMISSIONS) {
      const name = PERMISSION_LABELS[code];
      await this.prisma.permission.upsert({
        where: { code },
        update: { name, description: name },
        create: { code, name, description: name },
      });
    }

    // مدير النظام يحصل تلقائياً على أي صلاحية جديدة في النظام
    const superAdmin = await this.prisma.role.findUnique({
      where: { code: 'super_admin' },
      select: { id: true },
    });
    if (!superAdmin) return;

    const permissions = await this.prisma.permission.findMany({
      select: { id: true },
    });
    for (const permission of permissions) {
      await this.prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdmin.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: superAdmin.id,
          permissionId: permission.id,
        },
      });
    }
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

    await this.syncSystemPermissions();

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
      await this.syncSystemPermissions();
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
      metadata: { code: role.code },
      resource: 'roles',
      resourceId: id,
    });

    return { success: true };
  }
}
