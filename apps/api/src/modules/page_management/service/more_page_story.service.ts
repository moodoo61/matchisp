import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaNetworkPagesService } from '../../../database/database.module';
import { toAbsolutePublicUrl } from '../../../common/public-asset-url';
import { AuditService } from '../../audit/audit.service';
import { CreateMorePageStoryDto } from '../dto/create-more-page-story.dto';
import { UpdateMorePageStoryDto } from '../dto/update-more-page-story.dto';
import { PageCardFlagsService } from './page_card_flags.service';

@Injectable()
export class MorePageStoryService {
  constructor(
    private readonly prisma: PrismaNetworkPagesService,
    private readonly audit: AuditService,
    private readonly flags: PageCardFlagsService,
  ) {}

  listAdmin() {
    return this.prisma.morePageStoryBlock.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async listPublic() {
    if (!(await this.flags.isEnabled('more_page_story'))) return [];
    const items = await this.prisma.morePageStoryBlock.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return items.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      imageUrl: toAbsolutePublicUrl(item.imageUrl),
      variant: item.variant,
      sortOrder: item.sortOrder,
    }));
  }

  async get(id: string) {
    const item = await this.prisma.morePageStoryBlock.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException('المقطع غير موجود');
    return item;
  }

  async create(dto: CreateMorePageStoryDto, actorId: string) {
    const item = await this.prisma.morePageStoryBlock.create({
      data: {
        title: dto.title ?? null,
        body: dto.body,
        imageUrl: dto.imageUrl,
        variant: dto.variant ?? 'section',
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'page_management.more_page.story',
      resourceId: item.id,
    });
    return item;
  }

  async update(id: string, dto: UpdateMorePageStoryDto, actorId: string) {
    await this.get(id);
    const item = await this.prisma.morePageStoryBlock.update({
      where: { id },
      data: {
        title: dto.title,
        body: dto.body,
        imageUrl: dto.imageUrl,
        variant: dto.variant,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'page_management.more_page.story',
      resourceId: item.id,
    });
    return item;
  }

  async remove(id: string, actorId: string) {
    await this.get(id);
    await this.prisma.morePageStoryBlock.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'page_management.more_page.story',
      resourceId: id,
    });
    return { success: true };
  }
}
