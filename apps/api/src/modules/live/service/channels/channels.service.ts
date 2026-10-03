import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { EncodingSourceMode } from '@isp/shared';
import { Prisma } from '../../../../../generated/live';
import { PrismaLiveService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';
import { CreateChannelDto } from '../../dto/channels/create-channel.dto';
import { UpdateChannelDto } from '../../dto/channels/update-channel.dto';
import { MistServerService } from '../mist/mist_server.service';
import {
  assertSourceOptionAvailable,
  buildMistSourceForMode,
  resolveDefaultSourceMode,
} from '../encoding/source-options';
import { EncodingQualityService } from '../encoding/quality/encoding-quality.service';
import { resolveAbrProfileForRungs } from '../encoding/quality/abr-profile';
import {
  normalizeChannelPaths,
  normalizeLabel,
  normalizeName,
} from './channel-paths';
import { ChannelUniquenessService } from './channel-uniqueness';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    private readonly prisma: PrismaLiveService,
    private readonly audit: AuditService,
    private readonly mist: MistServerService,
    private readonly uniqueness: ChannelUniquenessService,
    private readonly encodingQuality: EncodingQualityService,
  ) {}

  async list() {
    const [items, mistStatuses, activeStats] = await Promise.all([
      this.prisma.channel.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: {
          section: { select: { id: true, name: true, label: true } },
        },
      }),
      this.mist.listStreamStatuses(),
      this.mist.listActiveStreamStats(),
    ]);

    return items.map((item) => ({
      ...item,
      mist: this.mist.statusFor(
        item.name,
        mistStatuses,
        activeStats.get(item.name)?.viewers ?? 0,
      ),
    }));
  }

  async get(id: string) {
    const item = await this.prisma.channel.findUnique({
      where: { id },
      include: {
        section: { select: { id: true, name: true, label: true } },
      },
    });
    if (!item) throw new NotFoundException('القناة غير موجودة');
    return item;
  }

  private async assertSection(sectionId: string) {
    const section = await this.prisma.channelSection.findUnique({
      where: { id: sectionId },
    });
    if (!section) throw new BadRequestException('القسم غير موجود');
    return section;
  }

  private resolveChannelSourceMode(
    preferred?: EncodingSourceMode | null,
    opts?: { allowFallback?: boolean },
  ): EncodingSourceMode {
    if (preferred) {
      try {
        assertSourceOptionAvailable(preferred);
        return preferred;
      } catch (err) {
        if (!opts?.allowFallback) {
          throw new BadRequestException(
            err instanceof Error ? err.message : 'خيار المصدر غير متاح',
          );
        }
      }
    }
    return resolveDefaultSourceMode(preferred);
  }

  private async resolveMistAndAbr(
    sourceMode: EncodingSourceMode,
    input: {
      type: 'IPTV' | 'HDMI';
      sourceUrl?: string | null;
      videoDevice?: string | null;
      audioDevice?: string | null;
    },
    qualityRungIds?: string[] | null,
  ) {
    let abrScriptPath: string | null = null;
    let abrProfileKey: string | null = null;
    let storedRungIds: string[] = [];

    if (sourceMode === 'encode_gpu') {
      try {
        const settings = await this.encodingQuality.getSettings();
        const profile = resolveAbrProfileForRungs(settings, qualityRungIds);
        abrScriptPath = profile.scriptPath;
        abrProfileKey = profile.profileKey;
        storedRungIds = profile.isGlobal ? [] : profile.rungIds;
      } catch (err) {
        throw new BadRequestException(
          err instanceof Error ? err.message : 'تعذر تجهيز ملف ABR',
        );
      }
    }

    try {
      const mistSource = buildMistSourceForMode(sourceMode, {
        ...input,
        abrScriptPath,
      });
      return { mistSource, abrProfileKey, qualityRungIds: storedRungIds };
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'مصدر MistServer غير صالح',
      );
    }
  }

  async create(dto: CreateChannelDto, actorId: string) {
    await this.assertSection(dto.sectionId);
    const name = normalizeName(dto.name);
    const label = normalizeLabel(dto.label);
    await this.uniqueness.assertUnique({ name, label });
    const paths = normalizeChannelPaths(dto);
    const sourceMode = this.resolveChannelSourceMode(dto.sourceMode);
    const { mistSource, abrProfileKey, qualityRungIds } =
      await this.resolveMistAndAbr(
        sourceMode,
        { type: dto.type, ...paths },
        dto.qualityRungIds,
      );
    const alwaysOn = dto.alwaysOn ?? false;

    await this.mist.upsertStream({ name, source: mistSource, alwaysOn });

    try {
      const item = await this.prisma.channel.create({
        data: {
          sectionId: dto.sectionId,
          name,
          label,
          type: dto.type,
          ...paths,
          sourceMode,
          qualityRungIds,
          abrProfileKey,
          imageUrl: dto.imageUrl?.trim() || null,
          alwaysOn,
          sortOrder: dto.sortOrder ?? 0,
          isActive: true,
        },
        include: {
          section: { select: { id: true, name: true, label: true } },
        },
      });
      await this.audit.log({
        actorId,
        action: 'create',
        resource: 'live.channel',
        resourceId: item.id,
        metadata: {
          name: item.name,
          label: item.label,
          sourceMode,
          abrProfileKey,
        },
      });
      return item;
    } catch (err) {
      await this.mist.deleteStream(name).catch(() => undefined);
      throw err;
    }
  }

  async update(id: string, dto: UpdateChannelDto, actorId: string) {
    const current = await this.get(id);
    if (dto.sectionId) await this.assertSection(dto.sectionId);

    const name = dto.name !== undefined ? normalizeName(dto.name) : undefined;
    const label =
      dto.label !== undefined ? normalizeLabel(dto.label) : undefined;
    await this.uniqueness.assertUnique({ name, label, excludeId: id });

    const type = dto.type ?? current.type;
    const paths = normalizeChannelPaths({
      type,
      sourceUrl:
        dto.sourceUrl !== undefined ? dto.sourceUrl : current.sourceUrl,
      videoDevice:
        dto.videoDevice !== undefined ? dto.videoDevice : current.videoDevice,
      audioDevice:
        dto.audioDevice !== undefined ? dto.audioDevice : current.audioDevice,
    });

    const nextName = name ?? current.name;
    const alwaysOn =
      dto.alwaysOn !== undefined ? dto.alwaysOn : current.alwaysOn;
    const sourceMode = this.resolveChannelSourceMode(
      dto.sourceMode ?? current.sourceMode,
      { allowFallback: dto.sourceMode === undefined },
    );
    const qualityRungIdsInput =
      dto.qualityRungIds !== undefined
        ? dto.qualityRungIds
        : current.qualityRungIds;
    const { mistSource, abrProfileKey, qualityRungIds } =
      await this.resolveMistAndAbr(
        sourceMode,
        { type, ...paths },
        qualityRungIdsInput,
      );
    const nameChanged = nextName !== current.name;

    await this.mist.upsertStream({
      name: nextName,
      source: mistSource,
      alwaysOn,
    });
    if (nameChanged) {
      await this.mist.deleteStream(current.name).catch(() => undefined);
    }

    const item = await this.prisma.channel.update({
      where: { id },
      data: {
        sectionId: dto.sectionId,
        name,
        label,
        type: dto.type,
        ...paths,
        sourceMode: dto.sourceMode !== undefined ? sourceMode : undefined,
        qualityRungIds,
        abrProfileKey,
        imageUrl:
          dto.imageUrl !== undefined
            ? dto.imageUrl?.trim() || null
            : undefined,
        alwaysOn: dto.alwaysOn,
        sortOrder: dto.sortOrder,
      },
      include: {
        section: { select: { id: true, name: true, label: true } },
      },
    });

    const definedKeys = (
      Object.keys(dto) as Array<keyof UpdateChannelDto>
    ).filter((key) => dto[key] !== undefined);
    const alwaysOnOnly =
      definedKeys.length === 1 && definedKeys[0] === 'alwaysOn';
    const action = alwaysOnOnly
      ? dto.alwaysOn
        ? 'always_on_enable'
        : 'always_on_disable'
      : 'update';

    await this.audit.log({
      actorId,
      action,
      resource: 'live.channel',
      resourceId: item.id,
      metadata: {
        name: item.name,
        ...(alwaysOnOnly ? { alwaysOn: dto.alwaysOn } : { abrProfileKey }),
      },
    });
    return item;
  }

  async remove(id: string, actorId: string) {
    const current = await this.get(id);

    // الواجهة تعرض مباريات «اليوم» فقط — قد تبقى مباريات بأيام أخرى في DB.
    // حذف القناة لا يُرفض بسببها: نمسح الارتباط ثم القناة (Cascade في schema أيضاً).
    const linkedMatches = await this.prisma.sportMatch.findMany({
      where: { channelId: id },
      select: { id: true, tournament: true, kickoffAt: true },
    });
    if (linkedMatches.length > 0) {
      await this.prisma.sportMatch.deleteMany({ where: { channelId: id } });
      this.logger.log(
        `حذف ${linkedMatches.length} مباراة مرتبطة بالقناة name=${current.name} قبل حذف القناة`,
      );
      await this.audit.log({
        actorId,
        action: 'delete_cascade',
        resource: 'live.sports_events.match',
        resourceId: id,
        metadata: {
          reason: 'channel_delete',
          channelName: current.name,
          count: linkedMatches.length,
          matches: linkedMatches.map((m) => ({
            id: m.id,
            tournament: m.tournament,
            kickoffAt: m.kickoffAt.toISOString(),
          })),
        },
      });
    }

    try {
      await this.mist.deleteStream(current.name);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `فشل حذف قناة Mist name=${current.name}: ${detail}`,
        err instanceof Error ? err.stack : undefined,
      );
      await this.audit.log({
        actorId,
        action: 'failed',
        resource: 'live.channel',
        resourceId: id,
        metadata: {
          op: 'delete',
          stage: 'mist',
          name: current.name,
          message: detail,
        },
      });
      throw err;
    }

    try {
      await this.prisma.channel.delete({ where: { id } });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `فشل حذف القناة من قاعدة البيانات بعد Mist name=${current.name} id=${id}: ${detail}`,
        err instanceof Error ? err.stack : undefined,
      );
      await this.audit.log({
        actorId,
        action: 'failed',
        resource: 'live.channel',
        resourceId: id,
        metadata: {
          op: 'delete',
          stage: 'database',
          name: current.name,
          message: detail,
          mistDeleted: true,
        },
      });
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new ConflictException(
          'لا يمكن حذف القناة لارتباطها بسجلات أخرى — راجع سجلات التدقيق',
        );
      }
      throw err;
    }

    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'live.channel',
      resourceId: id,
      metadata: {
        name: current.name,
        label: current.label,
        cascadedMatches: linkedMatches.length,
      },
    });
    return { success: true };
  }

  async stopSessions(id: string, actorId: string) {
    const current = await this.get(id);
    await this.mist.stopSessions(current.name);
    await this.audit.log({
      actorId,
      action: 'kick_sessions',
      resource: 'live.channel',
      resourceId: id,
      metadata: { name: current.name, label: current.label },
    });
    return { success: true, name: current.name };
  }

  async nukeStream(id: string, actorId: string) {
    const current = await this.get(id);
    await this.mist.nukeStream(current.name);
    await this.audit.log({
      actorId,
      action: 'force_stop',
      resource: 'live.channel',
      resourceId: id,
      metadata: { name: current.name, label: current.label },
    });
    return { success: true, name: current.name };
  }
}
