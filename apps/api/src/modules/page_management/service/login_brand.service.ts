import { Injectable } from '@nestjs/common';
import { toAbsolutePublicUrl } from '../../../common/public-asset-url';
import { PrismaNetworkPagesService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { GeneralSettingsService } from '../../settings/general/service/general-settings.service';
import { UpdateLoginBrandDto } from '../dto/update-login-brand.dto';

const DEFAULT_ID = 'default';

@Injectable()
export class LoginBrandService {
  constructor(
    private readonly prisma: PrismaNetworkPagesService,
    private readonly audit: AuditService,
    private readonly general: GeneralSettingsService,
  ) {}

  async get() {
    const row = await this.ensureRow();
    const general = await this.general.get();
    const resolved = this.resolve(row, general);
    return {
      id: row.id,
      useCustom: row.useCustom,
      name: row.name,
      logoUrl: row.logoUrl,
      logoAbsoluteUrl: toAbsolutePublicUrl(row.logoUrl) || null,
      updatedAt: row.updatedAt.toISOString(),
      /** القيم الفعلية المعروضة على صفحة الدخول */
      resolved,
      /** مرجع من الإعدادات العامة */
      general: {
        brandName: general.brandName,
        brandLogoUrl: general.brandLogoUrl,
        brandLogoAbsoluteUrl: general.brandLogoAbsoluteUrl,
      },
    };
  }

  /** للاستجابة العامة — اسم + شعار جاهزان للعرض */
  async getPublic() {
    const row = await this.ensureRow();
    const general = await this.general.get();
    return this.resolve(row, general);
  }

  async update(dto: UpdateLoginBrandDto, actorId: string) {
    await this.ensureRow();
    const item = await this.prisma.loginBrandSettings.update({
      where: { id: DEFAULT_ID },
      data: {
        ...(dto.useCustom !== undefined ? { useCustom: dto.useCustom } : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl.trim() } : {}),
      },
    });
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'page_management.login.brand',
      resourceId: item.id,
    });
    return this.get();
  }

  private resolve(
    row: { useCustom: boolean; name: string; logoUrl: string },
    general: {
      brandName: string;
      brandLogoUrl: string;
      brandLogoAbsoluteUrl: string | null;
    },
  ) {
    if (row.useCustom) {
      const name = row.name.trim() || general.brandName.trim();
      const logoPath = row.logoUrl.trim() || general.brandLogoUrl.trim();
      return {
        name,
        logoUrl: toAbsolutePublicUrl(logoPath) || '',
        source: 'custom' as const,
      };
    }
    return {
      name: general.brandName.trim(),
      logoUrl: general.brandLogoAbsoluteUrl || '',
      source: 'general' as const,
    };
  }

  private async ensureRow() {
    const existing = await this.prisma.loginBrandSettings.findUnique({
      where: { id: DEFAULT_ID },
    });
    if (existing) return existing;
    return this.prisma.loginBrandSettings.create({
      data: { id: DEFAULT_ID },
    });
  }
}
