import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaNetworkPagesService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { CreateMorePageAboutDto } from '../dto/create-more-page-about.dto';
import { UpdateMorePageAboutDto } from '../dto/update-more-page-about.dto';
import { PageCardFlagsService } from './page_card_flags.service';

@Injectable()
export class MorePageAboutService {
  constructor(
    private readonly prisma: PrismaNetworkPagesService,
    private readonly audit: AuditService,
    private readonly flags: PageCardFlagsService,
  ) {}

  listAdmin() {
    return this.prisma.morePageAboutCard.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async listPublic() {
    if (!(await this.flags.isEnabled('more_page_about'))) return [];
    return this.prisma.morePageAboutCard.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        title: true,
        body: true,
        iconKey: true,
        sortOrder: true,
      },
    });
  }

  async get(id: string) {
    const item = await this.prisma.morePageAboutCard.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException('البطاقة غير موجودة');
    return item;
  }

  async create(dto: CreateMorePageAboutDto, actorId: string) {
    const item = await this.prisma.morePageAboutCard.create({
      data: {
        title: dto.title,
        body: dto.body,
        iconKey: dto.iconKey ?? 'custom',
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'page_management.more_page.about',
      resourceId: item.id,
    });
    return item;
  }

  async update(id: string, dto: UpdateMorePageAboutDto, actorId: string) {
    await this.get(id);
    const item = await this.prisma.morePageAboutCard.update({
      where: { id },
      data: {
        title: dto.title,
        body: dto.body,
        iconKey: dto.iconKey,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'page_management.more_page.about',
      resourceId: item.id,
    });
    return item;
  }

  async remove(id: string, actorId: string) {
    await this.get(id);
    await this.prisma.morePageAboutCard.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'page_management.more_page.about',
      resourceId: id,
    });
    return { success: true };
  }
}
