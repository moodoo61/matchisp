import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaLiveService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';
import { CreateSportMatchDto } from '../dto/create-sport-match.dto';
import { UpdateSportMatchDto } from '../dto/update-sport-match.dto';
import { SportsEventsSettingsService } from './sports-events-settings.service';
import { zonedDayBounds } from '../utils/zoned-day-bounds';

const matchInclude = {
  homeTeam: true,
  awayTeam: true,
  channel: { select: { id: true, name: true, label: true } },
} as const;

@Injectable()
export class SportMatchesService {
  constructor(
    private readonly prisma: PrismaLiveService,
    private readonly audit: AuditService,
    private readonly settings: SportsEventsSettingsService,
  ) {}

  async listToday() {
    const { timezone } = await this.settings.getSettings();
    const { start, end } = zonedDayBounds(new Date(), timezone);
    return this.prisma.sportMatch.findMany({
      where: { kickoffAt: { gte: start, lt: end } },
      include: matchInclude,
      orderBy: { kickoffAt: 'asc' },
    });
  }

  /** مباريات اليوم للواجهة العامة (صفحة المشاهدة) */
  async listTodayPublic() {
    const settings = await this.settings.getSettings();
    if (!settings.enabled) return [];

    const rows = await this.listToday();
    return rows.map((row) => ({
      id: row.id,
      tournament: row.tournament,
      kickoffAt: row.kickoffAt.toISOString(),
      homeTeam: {
        id: row.homeTeam.id,
        name: row.homeTeam.name,
        type: row.homeTeam.type,
        logoUrl: row.homeTeam.logoUrl,
      },
      awayTeam: {
        id: row.awayTeam.id,
        name: row.awayTeam.name,
        type: row.awayTeam.type,
        logoUrl: row.awayTeam.logoUrl,
      },
      channel: {
        id: row.channel.id,
        name: row.channel.name,
        label: row.channel.label,
      },
    }));
  }

  list() {
    return this.prisma.sportMatch.findMany({
      include: matchInclude,
      orderBy: { kickoffAt: 'asc' },
    });
  }

  async get(id: string) {
    const match = await this.prisma.sportMatch.findUnique({
      where: { id },
      include: matchInclude,
    });
    if (!match) throw new NotFoundException('المباراة غير موجودة');
    return match;
  }

  async create(dto: CreateSportMatchDto, actorId: string) {
    await this.assertTeamsAndChannel(dto.homeTeamId, dto.awayTeamId, dto.channelId);

    const match = await this.prisma.sportMatch.create({
      data: {
        tournament: dto.tournament.trim(),
        homeTeamId: dto.homeTeamId,
        awayTeamId: dto.awayTeamId,
        kickoffAt: new Date(dto.kickoffAt),
        channelId: dto.channelId,
      },
      include: matchInclude,
    });

    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'live.sports_events.match',
      resourceId: match.id,
      metadata: {
        tournament: match.tournament,
        kickoffAt: match.kickoffAt.toISOString(),
      },
    });

    return match;
  }

  async update(id: string, dto: UpdateSportMatchDto, actorId: string) {
    const existing = await this.get(id);
    const homeTeamId = dto.homeTeamId ?? existing.homeTeamId;
    const awayTeamId = dto.awayTeamId ?? existing.awayTeamId;
    const channelId = dto.channelId ?? existing.channelId;
    await this.assertTeamsAndChannel(homeTeamId, awayTeamId, channelId);

    const match = await this.prisma.sportMatch.update({
      where: { id },
      data: {
        tournament: dto.tournament?.trim(),
        homeTeamId: dto.homeTeamId,
        awayTeamId: dto.awayTeamId,
        kickoffAt: dto.kickoffAt ? new Date(dto.kickoffAt) : undefined,
        channelId: dto.channelId,
      },
      include: matchInclude,
    });

    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'live.sports_events.match',
      resourceId: match.id,
      metadata: { fields: Object.keys(dto) },
    });

    return match;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.get(id);
    try {
      await this.prisma.sportMatch.delete({ where: { id } });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.audit.log({
        actorId,
        action: 'failed',
        resource: 'live.sports_events.match',
        resourceId: id,
        metadata: {
          op: 'delete',
          tournament: existing.tournament,
          channelId: existing.channelId,
          message,
        },
      });
      throw err;
    }

    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'live.sports_events.match',
      resourceId: id,
      metadata: {
        tournament: existing.tournament,
        channelId: existing.channelId,
        kickoffAt: existing.kickoffAt.toISOString(),
      },
    });

    return { success: true };
  }

  private async assertTeamsAndChannel(
    homeTeamId: string,
    awayTeamId: string,
    channelId: string,
  ) {
    if (homeTeamId === awayTeamId) {
      throw new BadRequestException('يجب أن يكون الفريقان مختلفين');
    }

    const [home, away, channel] = await Promise.all([
      this.prisma.sportTeam.findUnique({ where: { id: homeTeamId } }),
      this.prisma.sportTeam.findUnique({ where: { id: awayTeamId } }),
      this.prisma.channel.findUnique({ where: { id: channelId } }),
    ]);

    if (!home) throw new NotFoundException('الفريق الأول غير موجود');
    if (!away) throw new NotFoundException('الفريق الثاني غير موجود');
    if (!channel) throw new NotFoundException('القناة غير موجودة');
  }
}
