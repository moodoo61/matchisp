import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaNetworkPagesService } from '../../../database/database.module';
import { toAbsolutePublicUrl } from '../../../common/public-asset-url';
import { AuditService } from '../../audit/audit.service';
import { CreateImageAdDto } from '../dto/create-image-ad.dto';
import { UpdateImageAdDto } from '../dto/update-image-ad.dto';
import { PageCardFlagsService } from './page_card_flags.service';

@Injectable()
export class LoginImageAdsService {
  constructor(
    private readonly prisma: PrismaNetworkPagesService,
    private readonly audit: AuditService,
    private readonly flags: PageCardFlagsService,
  ) {}

  listAdmin() {
    return this.prisma.imageAd.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async listPublic() {
    if (!(await this.flags.isEnabled('login_images'))) return [];
    const items = await this.prisma.imageAd.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return items.map((ad) => ({
      url: toAbsolutePublicUrl(ad.imageUrl),
      link: ad.linkUrl ?? '',
    }));
  }

  async get(id: string) {
    const item = await this.prisma.imageAd.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('إعلان الصورة غير موجود');
    return item;
  }

  async create(dto: CreateImageAdDto, actorId: string) {
    const item = await this.prisma.imageAd.create({
      data: {
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'page_management.login.image_ad',
      resourceId: item.id,
    });
    return item;
  }

  async update(id: string, dto: UpdateImageAdDto, actorId: string) {
    await this.get(id);
    const item = await this.prisma.imageAd.update({
      where: { id },
      data: {
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl === undefined ? undefined : dto.linkUrl,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'page_management.login.image_ad',
      resourceId: item.id,
    });
    return item;
  }

  async remove(id: string, actorId: string) {
    await this.get(id);
    await this.prisma.imageAd.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'page_management.login.image_ad',
      resourceId: id,
    });
    return { success: true };
  }
}
