import { Injectable } from '@nestjs/common';
import { PrismaNetworkPagesService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { UpdateMorePageSettingsDto } from '../dto/update-more-page-settings.dto';

const DEFAULT_ID = 'default';

@Injectable()
export class MorePageSettingsService {
  constructor(
    private readonly prisma: PrismaNetworkPagesService,
    private readonly audit: AuditService,
  ) {}

  async get() {
    const existing = await this.prisma.morePageSettings.findUnique({
      where: { id: DEFAULT_ID },
    });
    if (existing) return existing;
    return this.prisma.morePageSettings.create({
      data: { id: DEFAULT_ID },
    });
  }

  async update(dto: UpdateMorePageSettingsDto, actorId: string) {
    await this.get();
    const item = await this.prisma.morePageSettings.update({
      where: { id: DEFAULT_ID },
      data: {
        heroTitle: dto.heroTitle,
        heroSubtitle: dto.heroSubtitle,
        itemsSectionTitle: dto.itemsSectionTitle,
        itemsSectionSubtitle: dto.itemsSectionSubtitle,
        aboutSectionTitle: dto.aboutSectionTitle,
        aboutSectionSubtitle: dto.aboutSectionSubtitle,
        storySectionTitle: dto.storySectionTitle,
        storySectionSubtitle: dto.storySectionSubtitle,
        footerText: dto.footerText,
      },
    });
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'page_management.more_page.settings',
      resourceId: item.id,
    });
    return item;
  }
}
