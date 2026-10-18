import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../../generated/network_pages';
import { PrismaNetworkPagesService } from '../../../database/database.module';
import { toAbsolutePublicUrl } from '../../../common/public-asset-url';
import { AuditService } from '../../audit/audit.service';
import { CreateMorePageItemDto } from '../dto/create-more-page-item.dto';
import { UpdateMorePageItemDto } from '../dto/update-more-page-item.dto';
import { PageCardFlagsService } from './page_card_flags.service';

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.filter((v): v is string => typeof v === 'string');
  return items.length ? items : null;
}

@Injectable()
export class MorePageItemsService {
  constructor(
    private readonly prisma: PrismaNetworkPagesService,
    private readonly audit: AuditService,
    private readonly flags: PageCardFlagsService,
  ) {}

  async listAdmin() {
    const items = await this.prisma.morePageItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return items.map((item) => ({
      ...item,
      instructions: asStringArray(item.instructions),
    }));
  }

  async listPublic() {
    if (!(await this.flags.isEnabled('more_page_items'))) return [];
    const items = await this.prisma.morePageItem.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: toAbsolutePublicUrl(item.imageUrl),
      description: item.description,
      instructions: asStringArray(item.instructions),
      sortOrder: item.sortOrder,
    }));
  }

  async get(id: string) {
    const item = await this.prisma.morePageItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('العنصر غير موجود');
    return item;
  }

  async create(dto: CreateMorePageItemDto, actorId: string) {
    const item = await this.prisma.morePageItem.create({
      data: {
        name: dto.name,
        imageUrl: dto.imageUrl,
        description: dto.description,
        instructions:
          dto.instructions === undefined
            ? Prisma.JsonNull
            : (dto.instructions as Prisma.InputJsonValue),
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'page_management.more_page.item',
      resourceId: item.id,
    });
    return item;
  }

  async update(id: string, dto: UpdateMorePageItemDto, actorId: string) {
    await this.get(id);
    const item = await this.prisma.morePageItem.update({
      where: { id },
      data: {
        name: dto.name,
        imageUrl: dto.imageUrl,
        description: dto.description,
        instructions:
          dto.instructions === undefined
            ? undefined
            : dto.instructions === null
              ? Prisma.JsonNull
              : (dto.instructions as Prisma.InputJsonValue),
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'page_management.more_page.item',
      resourceId: item.id,
    });
    return item;
  }

  async remove(id: string, actorId: string) {
    await this.get(id);
    await this.prisma.morePageItem.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'page_management.more_page.item',
      resourceId: id,
    });
    return { success: true };
  }
}
