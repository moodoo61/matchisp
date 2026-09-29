import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import { PrismaCoreService } from '../../database/database.module';
import { AuditService } from '../audit/audit.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './team.dto';

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaCoreService,
    private readonly audit: AuditService,
  ) {}

  private mapUser(
    user: Awaited<ReturnType<TeamService['findOneRaw']>>,
  ) {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map((ur) => ({
        id: ur.role.id,
        code: ur.role.code,
        name: ur.role.name,
      })),
    };
  }

  private findOneRaw(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
      },
    });
  }

  async list() {
    const users = await this.prisma.user.findMany({
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return users.map((u) => this.mapUser(u)!);
  }

  async get(id: string) {
    const user = await this.findOneRaw(id);
    if (!user) throw new NotFoundException('العضو غير موجود');
    return this.mapUser(user)!;
  }

  async create(dto: CreateTeamMemberDto, actorId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException('اسم المستخدم مستخدم مسبقاً');
    }

    const passwordHash = await hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        username: dto.username,
        passwordHash,
        roles: dto.roleIds?.length
          ? {
              create: dto.roleIds.map((roleId) => ({ roleId })),
            }
          : undefined,
      },
      include: { roles: { include: { role: true } } },
    });

    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'team',
      resourceId: user.id,
      metadata: { username: user.username },
    });

    return this.mapUser(user)!;
  }

  async update(id: string, dto: UpdateTeamMemberDto, actorId: string) {
    const existing = await this.findOneRaw(id);
    if (!existing) throw new NotFoundException('العضو غير موجود');

    const passwordHash = dto.password
      ? await hash(dto.password, 12)
      : undefined;

    if (dto.roleIds) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      if (dto.roleIds.length) {
        await this.prisma.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        status: dto.status,
        passwordHash,
      },
      include: { roles: { include: { role: true } } },
    });

    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'team',
      resourceId: user.id,
      metadata: { fields: Object.keys(dto) },
    });

    return this.mapUser(user)!;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.findOneRaw(id);
    if (!existing) throw new NotFoundException('العضو غير موجود');

    await this.prisma.user.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'team',
      resourceId: id,
      metadata: { username: existing.username },
    });

    return { success: true };
  }
}
