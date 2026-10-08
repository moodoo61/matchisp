import { Injectable } from '@nestjs/common';
import { toAbsolutePublicUrl } from '../../../../common/public-asset-url';
import { PrismaSettingsService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';
import {
  findUiFont,
  resolveUiFontId,
} from '../constants/general-fonts';
import {
  DEFAULT_GENERAL_SETTINGS,
  GENERAL_SETTINGS_ID,
} from '../constants/general-settings';
import { UpdateGeneralSettingsDto } from '../dto/update-general-settings.dto';
import { GeneralFontStorageService } from './general-font-storage.service';

@Injectable()
export class GeneralSettingsService {
  constructor(
    private readonly prisma: PrismaSettingsService,
    private readonly audit: AuditService,
    private readonly fonts: GeneralFontStorageService,
  ) {}

  async get() {
    const row = await this.ensureRow();
    return this.toDto(row);
  }

  async getUiTheme() {
    const row = await this.ensureRow();
    const uiFontId = resolveUiFontId(row.uiFontId);
    const font = findUiFont(uiFontId)!;
    // روابط نسبية عبر proxy الواجهة — تجنّب CORS مع منفذ الـ API المباشر
    return {
      uiFontId,
      family: font.family,
      localReady: this.fonts.isLocalReady(uiFontId),
      faces: this.fonts.getFaces(uiFontId),
    };
  }

  listFonts() {
    return this.fonts.listCatalog();
  }

  async downloadFont(fontId: string, actorId: string) {
    const result = await this.fonts.ensureLocal(fontId);
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'settings.general.font',
      resourceId: result.id,
      metadata: { fontId: result.id, localReady: result.localReady },
    });
    return result;
  }

  async update(dto: UpdateGeneralSettingsDto, actorId: string) {
    await this.ensureRow();

    const uiFontId =
      dto.uiFontId !== undefined ? resolveUiFontId(dto.uiFontId) : undefined;

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
        ...(uiFontId !== undefined ? { uiFontId } : {}),
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
        uiFontId: updated.uiFontId,
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
        uiFontId: DEFAULT_GENERAL_SETTINGS.uiFontId,
      },
    });
  }

  private toDto(row: {
    id: string;
    systemName: string;
    logoUrl: string;
    brandName: string;
    brandLogoUrl: string;
    uiFontId: string;
    updatedAt: Date;
  }) {
    const uiFontId = resolveUiFontId(row.uiFontId);
    const font = findUiFont(uiFontId)!;
    return {
      id: row.id,
      systemName: row.systemName,
      logoUrl: row.logoUrl,
      logoAbsoluteUrl: toAbsolutePublicUrl(row.logoUrl) || null,
      brandName: row.brandName,
      brandLogoUrl: row.brandLogoUrl,
      brandLogoAbsoluteUrl: toAbsolutePublicUrl(row.brandLogoUrl) || null,
      uiFontId,
      uiFontFamily: font.family,
      uiFontLocalReady: this.fonts.isLocalReady(uiFontId),
      uiFontFaces: this.fonts.getFaces(uiFontId),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
