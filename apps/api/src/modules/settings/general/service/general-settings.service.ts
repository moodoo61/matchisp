import { Injectable } from '@nestjs/common';
import { toAbsolutePublicUrl } from '../../../../common/public-asset-url';
import { PrismaSettingsService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';
import {
  DEFAULT_GENERAL_SETTINGS,
  GENERAL_SETTINGS_ID,
} from '../constants/general-settings';
import { UpdateGeneralSettingsDto } from '../dto/update-general-settings.dto';

@Injectable()
export class GeneralSettingsService {
  constructor(
    private readonly prisma: PrismaSettingsService,
    private readonly audit: AuditService,
  ) {}

  async get() {
    const row = await this.ensureRow();
    return this.toDto(row);
  }

  async update(dto: UpdateGeneralSettingsDto, actorId: string) {
    await this.ensureRow();
    const updated = await this.prisma.generalSettings.update({
      where: { id: GENERAL_SETTINGS_ID },
      data: {
        ...(dto.systemName !== undefined
          ? { systemName: dto.systemName.trim() }
          : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl.trim() } : {}),
        ...(dto.brandName !== undefined
          ? { brandName: dto.brandName.trim() }
          : {}),
        ...(dto.brandLogoUrl !== undefined
          ? { brandLogoUrl: dto.brandLogoUrl.trim() }
          : {}),
      },
    });

    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'settings.general',
      resourceId: updated.id,
      metadata: {
        systemName: updated.systemName,
        logoUrl: updated.logoUrl,
        brandName: updated.brandName,
        brandLogoUrl: updated.brandLogoUrl,
      },
    });

    return this.toDto(updated);
  }

  private async ensureRow() {
    const existing = await this.prisma.generalSettings.findUnique({
      where: { id: GENERAL_SETTINGS_ID },
    });
    if (existing) return existing;
    return this.prisma.generalSettings.create({
      data: {
        id: GENERAL_SETTINGS_ID,
        systemName: DEFAULT_GENERAL_SETTINGS.systemName,
        logoUrl: DEFAULT_GENERAL_SETTINGS.logoUrl,
        brandName: DEFAULT_GENERAL_SETTINGS.brandName,
        brandLogoUrl: DEFAULT_GENERAL_SETTINGS.brandLogoUrl,
      },
    });
  }

  private toDto(row: {
    id: string;
    systemName: string;
    logoUrl: string;
    brandName: string;
    brandLogoUrl: string;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      systemName: row.systemName,
      logoUrl: row.logoUrl,
      logoAbsoluteUrl: toAbsolutePublicUrl(row.logoUrl) || null,
      brandName: row.brandName,
      brandLogoUrl: row.brandLogoUrl,
      brandLogoAbsoluteUrl: toAbsolutePublicUrl(row.brandLogoUrl) || null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
