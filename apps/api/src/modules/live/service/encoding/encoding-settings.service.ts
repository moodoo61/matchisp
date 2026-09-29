import { Injectable, BadRequestException } from '@nestjs/common';
import {
  DEFAULT_ENCODING_SOURCE_MODE,
  isEncodingSourceMode,
  type EncodingSourceMode,
} from '@isp/shared';
import { PrismaLiveService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';
import { ENCODING_SOURCE_META_KEY } from '../../constants/encoding-source';
import { UpdateEncodingSettingsDto } from '../../dto/encoding/update-encoding-settings.dto';
import {
  assertSourceOptionAvailable,
  listImplementedSourceOptions,
  listSourceOptionCatalog,
  resolveDefaultSourceMode,
} from './source-options';

@Injectable()
export class EncodingSettingsService {
  constructor(
    private readonly prisma: PrismaLiveService,
    private readonly audit: AuditService,
  ) {}

  /** كتالوج خيارات المصدر (المتاح + غير المُنفَّذ بعد) */
  listSourceOptions() {
    return {
      options: listSourceOptionCatalog(),
      implemented: listImplementedSourceOptions().map((item) => item.mode),
      defaultMode: resolveDefaultSourceMode(),
    };
  }

  /** الخيارات المُنفَّذة فقط — لاستخدام نموذج إضافة القناة */
  listAvailableSourceOptions() {
    return {
      options: listImplementedSourceOptions().map((item) => ({
        value: item.mode,
        label: item.label,
        description: item.description,
        available: true as const,
      })),
      defaultMode: resolveDefaultSourceMode(),
    };
  }

  async getSettings() {
    const row = await this.prisma.sectionMeta.findUnique({
      where: { key: ENCODING_SOURCE_META_KEY },
    });
    const sourceMode = this.resolveStoredMode(row?.value);
    return {
      sourceMode,
      options: listSourceOptionCatalog(),
    };
  }

  async updateSettings(dto: UpdateEncodingSettingsDto, actorId: string) {
    try {
      assertSourceOptionAvailable(dto.sourceMode);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'خيار المصدر غير متاح',
      );
    }

    await this.prisma.sectionMeta.upsert({
      where: { key: ENCODING_SOURCE_META_KEY },
      create: { key: ENCODING_SOURCE_META_KEY, value: dto.sourceMode },
      update: { value: dto.sourceMode },
    });
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'live.encoding.settings',
      resourceId: ENCODING_SOURCE_META_KEY,
      metadata: { sourceMode: dto.sourceMode },
    });
    return {
      sourceMode: dto.sourceMode,
      options: listSourceOptionCatalog(),
    };
  }

  private resolveStoredMode(value: string | null | undefined): EncodingSourceMode {
    if (isEncodingSourceMode(value)) {
      return resolveDefaultSourceMode(value);
    }
    return resolveDefaultSourceMode(DEFAULT_ENCODING_SOURCE_MODE);
  }
}
