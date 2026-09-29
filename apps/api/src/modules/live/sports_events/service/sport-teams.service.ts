import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../../../generated/live';
import { PrismaLiveService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';
import { CreateSportTeamDto } from '../dto/create-sport-team.dto';
import { UpdateSportTeamDto } from '../dto/update-sport-team.dto';

@Injectable()
export class SportTeamsService {
  constructor(
    private readonly prisma: PrismaLiveService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.sportTeam.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async get(id: string) {
    const team = await this.prisma.sportTeam.findUnique({ where: { id } });
    if (!team) throw new NotFoundException('الفريق غير موجود');
    return team;
  }

  async create(dto: CreateSportTeamDto, actorId: string) {
    try {
      const team = await this.prisma.sportTeam.create({
        data: {
          name: dto.name.trim(),
          type: dto.type,
          logoUrl: dto.logoUrl?.trim() || null,
        },
      });

      await this.audit.log({
        actorId,
        action: 'create',
        resource: 'live.sports_events.team',
        resourceId: team.id,
        metadata: { name: team.name, type: team.type },
      });

      return team;
    } catch (err) {
      this.rethrowUnique(err);
      throw err;
    }
  }

  async update(id: string, dto: UpdateSportTeamDto, actorId: string) {
    await this.get(id);
    try {
      const team = await this.prisma.sportTeam.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          type: dto.type,
          ...(dto.logoUrl !== undefined
            ? { logoUrl: dto.logoUrl?.trim() || null }
            : {}),
        },
      });

      await this.audit.log({
        actorId,
        action: 'update',
        resource: 'live.sports_events.team',
        resourceId: team.id,
        metadata: { fields: Object.keys(dto) },
      });

      return team;
    } catch (err) {
      this.rethrowUnique(err);
      throw err;
    }
  }

  async remove(id: string, actorId: string) {
    const existing = await this.get(id);
    try {
      await this.prisma.sportTeam.delete({ where: { id } });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new ConflictException(
          'لا يمكن حذف الفريق لارتباطه بمباريات — احذف المباريات أولاً',
        );
      }
      throw err;
    }

    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'live.sports_events.team',
      resourceId: id,
      metadata: { name: existing.name, type: existing.type },
    });

    return { success: true };
  }

  private rethrowUnique(err: unknown): void {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new ConflictException('يوجد فريق بنفس الاسم والنوع مسبقاً');
    }
  }
}
