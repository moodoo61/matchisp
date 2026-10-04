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
import { HlsMasterProbeService } from '../encoding/source-options/passthrough-ffmpeg/hls-master-probe.service';
import { HlsMasterPlaylistService } from '../encoding/source-options/passthrough-ffmpeg/hls-master-playlist.service';
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
    private readonly hlsProbe: HlsMasterProbeService,
    private readonly hlsPlaylist: HlsMasterPlaylistService,
  ) {}

  async list() {
    const [items, mistStatuses, activeStats, inputStats] = await Promise.all([
      this.prisma.channel.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: {
          section: { select: { id: true, name: true, label: true } },
        },
      }),
      this.mist.listStreamStatuses(),
      this.mist.listActiveStreamStats(),
      this.mist.listInputStats(),
    ]);

    return items.map((item) => {
      const stats = activeStats.get(item.name);
      return {
        ...item,
        mist: this.mist.statusFor(
          item.name,
          mistStatuses,
          stats?.viewers ?? 0,
          inputStats.get(item.name) ?? null,
        ),
      };
    });
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

  /**
   * مباشر ffmpeg + مستويات HLS — المصدر النهائي دائماً عبر ffpass (ts-exec):
   * - مستوى واحد → رابط المستوى
   * - أكثر من مستوى → master محلي موحّد يُمرَّر كدخل واحد لـ ffpass
   */
  private async resolveFfmpegIptvSource(input: {
    sourceMode: EncodingSourceMode;
    type: 'IPTV' | 'HDMI';
    channelName: string;
    sourceUrl: string | null;
    /** إن وُجدت (حتى فارغة) يعني أن الواجهة أرسلت اختيار تحليل HLS */
    hlsVariantUrls?: string[];
  }): Promise<{
    sourceUrl: string | null;
    mistSourceMode: EncodingSourceMode;
  }> {
    if (input.sourceMode !== 'passthrough_ffmpeg' || input.type !== 'IPTV') {
      return {
        sourceUrl: input.sourceUrl,
        mistSourceMode: input.sourceMode,
      };
    }

    const masterUrl = input.sourceUrl?.trim() || '';

    // تحديث بدون إعادة تحليل (مثل alwaysOn) — أبقِ المصدر كما هو، مع ffpass دائماً
    if (input.hlsVariantUrls === undefined) {
      if (!masterUrl) {
        throw new BadRequestException('مصدر IPTV مطلوب لوضع مباشر ffmpeg');
      }
      return {
        sourceUrl: masterUrl,
        mistSourceMode: 'passthrough_ffmpeg',
      };
    }

    const selected = [
      ...new Set(input.hlsVariantUrls.map((u) => u.trim()).filter(Boolean)),
    ];
    if (selected.length < 1) {
      throw new BadRequestException(
        'اختر مستوى جودة واحداً على الأقل بعد تحليل الرابط',
      );
    }
    if (!masterUrl) {
      throw new BadRequestException(
        'رابط المصدر الأصلي مطلوب مع اختيار مستويات الجودة',
      );
    }

    const built = await this.hlsPlaylist.buildFromSelection({
      channelName: input.channelName,
      masterUrl,
      selectedUrls: selected,
    });
    return {
      sourceUrl: built.mistUrl,
      mistSourceMode: 'passthrough_ffmpeg',
    };
  }

  private async assertHdmiDeviceFree(
    videoDevice: string | null | undefined,
    exceptChannelId?: string,
  ) {
    const path = videoDevice?.trim();
    if (!path) return;
    const taken = await this.prisma.channel.findFirst({
      where: {
        type: 'HDMI',
        videoDevice: path,
        ...(exceptChannelId ? { id: { not: exceptChannelId } } : {}),
      },
      select: { id: true, label: true },
    });
    if (taken) {
      throw new ConflictException(
        `جهاز HDMI مستخدم مسبقاً في القناة «${taken.label}»`,
      );
    }
  }

  async create(dto: CreateChannelDto, actorId: string) {
    await this.assertSection(dto.sectionId);
    const name = normalizeName(dto.name);
    const label = normalizeLabel(dto.label);
    await this.uniqueness.assertUnique({ name, label });
    const paths = normalizeChannelPaths(dto);
    await this.assertHdmiDeviceFree(paths.videoDevice);
    const sourceMode = this.resolveChannelSourceMode(dto.sourceMode);
    const resolved = await this.resolveFfmpegIptvSource({
      sourceMode,
      type: dto.type,
      channelName: name,
      sourceUrl: paths.sourceUrl,
      hlsVariantUrls: dto.hlsVariantUrls,
    });
    const effectivePaths = { ...paths, sourceUrl: resolved.sourceUrl };
    const { mistSource, abrProfileKey, qualityRungIds } =
      await this.resolveMistAndAbr(
        resolved.mistSourceMode,
        { type: dto.type, ...effectivePaths },
        dto.qualityRungIds,
      );
    const alwaysOn = dto.alwaysOn ?? false;

    this.logger.log(
      `تسجيل قناة name=${name} mode=${sourceMode} mistMode=${resolved.mistSourceMode} mistSource=${mistSource}`,
    );
    await this.mist.upsertStream({ name, source: mistSource, alwaysOn });

    try {
      const item = await this.prisma.channel.create({
        data: {
          sectionId: dto.sectionId,
          name,
          label,
          type: dto.type,
          ...effectivePaths,
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
    await this.assertHdmiDeviceFree(paths.videoDevice, id);

    const nextName = name ?? current.name;
    const alwaysOn =
      dto.alwaysOn !== undefined ? dto.alwaysOn : current.alwaysOn;
    const sourceMode = this.resolveChannelSourceMode(
      dto.sourceMode ?? current.sourceMode,
      { allowFallback: dto.sourceMode === undefined },
    );
    const resolved = await this.resolveFfmpegIptvSource({
      sourceMode,
      type,
      channelName: nextName,
      sourceUrl: paths.sourceUrl,
      hlsVariantUrls: dto.hlsVariantUrls,
    });
    const effectivePaths = { ...paths, sourceUrl: resolved.sourceUrl };
    const qualityRungIdsInput =
      dto.qualityRungIds !== undefined
        ? dto.qualityRungIds
        : current.qualityRungIds;
    const { mistSource, abrProfileKey, qualityRungIds } =
      await this.resolveMistAndAbr(
        resolved.mistSourceMode,
        { type, ...effectivePaths },
        qualityRungIdsInput,
      );
    const nameChanged = nextName !== current.name;

    this.logger.log(
      `تحديث قناة name=${nextName} mode=${sourceMode} mistMode=${resolved.mistSourceMode} mistSource=${mistSource}`,
    );
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
        ...effectivePaths,
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

    // المباريات مستقلة: ON DELETE SET NULL يصفّر channelId دون حذف المباراة.
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
      metadata: { name: current.name, label: current.label },
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
