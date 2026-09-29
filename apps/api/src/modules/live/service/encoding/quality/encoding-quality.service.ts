import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import {
  DEFAULT_ENCODING_QUALITY,
  enabledEncodingRungs,
  normalizeEncodingQuality,
  type EncodingQualitySettings,
} from '@isp/shared';
import { PrismaLiveService } from '../../../../../database/database.module';
import { AuditService } from '../../../../audit/audit.service';
import { ENCODING_QUALITY_META_KEY } from '../../../constants/encoding-source';
import { UpdateEncodingQualityDto } from '../../../dto/encoding/update-encoding-quality.dto';
import {
  resolveAbrConfigPath,
  resolveAbrScriptPath,
  writeAbrRuntimeConfig,
} from './abr-runtime-config';

@Injectable()
export class EncodingQualityService implements OnModuleInit {
  private readonly logger = new Logger(EncodingQualityService.name);

  constructor(
    private readonly prisma: PrismaLiveService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureRuntimeConfig();
    } catch (err) {
      this.logger.warn(
        `تعذر تجهيز ملف إعدادات ABR: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  async getQuality() {
    const settings = await this.loadSettings();
    return {
      ...settings,
      scriptPath: resolveAbrScriptPath(),
      configPath: resolveAbrConfigPath(),
    };
  }

  /** إعدادات الجودة فقط (بدون مسارات) — لاستخدام القنوات */
  async getSettings(): Promise<EncodingQualitySettings> {
    return this.loadSettings();
  }

  async updateQuality(dto: UpdateEncodingQualityDto, actorId: string) {
    const settings = normalizeEncodingQuality({
      rungs: dto.rungs.map((rung) => ({
        id: rung.id,
        enabled: rung.enabled ?? true,
        bitrateKbps: rung.bitrateKbps,
        maxrateKbps: rung.maxrateKbps,
        bufsizeKbps: rung.bufsizeKbps,
      })),
    });

    if (enabledEncodingRungs(settings).length === 0) {
      throw new BadRequestException('يجب تفعيل جودة واحدة على الأقل');
    }

    await this.prisma.sectionMeta.upsert({
      where: { key: ENCODING_QUALITY_META_KEY },
      create: {
        key: ENCODING_QUALITY_META_KEY,
        value: JSON.stringify(settings),
      },
      update: { value: JSON.stringify(settings) },
    });

    const configPath = writeAbrRuntimeConfig(settings);
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'live.encoding.quality',
      resourceId: ENCODING_QUALITY_META_KEY,
      metadata: {
        enabled: enabledEncodingRungs(settings).map((r) => r.id),
        configPath,
      },
    });

    return {
      ...settings,
      scriptPath: resolveAbrScriptPath(),
      configPath,
    };
  }

  async ensureRuntimeConfig() {
    const settings = await this.loadSettings();
    const configPath = writeAbrRuntimeConfig(settings);
    this.logger.log(`ABR config ready: ${configPath}`);
    return settings;
  }

  private async loadSettings(): Promise<EncodingQualitySettings> {
    const row = await this.prisma.sectionMeta.findUnique({
      where: { key: ENCODING_QUALITY_META_KEY },
    });
    if (!row?.value) return { ...DEFAULT_ENCODING_QUALITY };
    try {
      return normalizeEncodingQuality(
        JSON.parse(row.value) as Partial<EncodingQualitySettings>,
      );
    } catch {
      return { ...DEFAULT_ENCODING_QUALITY };
    }
  }
}
