import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaNetworkPagesService } from '../../../database/database.module';
import { toAbsolutePublicUrl } from '../../../common/public-asset-url';
import { AuditService } from '../../audit/audit.service';
import { CreateStatusServiceDto } from '../dto/create-status-service.dto';
import { UpdateStatusServiceDto } from '../dto/update-status-service.dto';
import { PageCardFlagsService } from './page_card_flags.service';

@Injectable()
export class StatusServicesService {
  constructor(
    private readonly prisma: PrismaNetworkPagesService,
    private readonly audit: AuditService,
    private readonly flags: PageCardFlagsService,
  ) {}

  listAdmin() {
    return this.prisma.statusService.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async listPublic() {
    if (!(await this.flags.isEnabled('status_services'))) return [];
    const items = await this.prisma.statusService.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      url: item.linkUrl,
      image: toAbsolutePublicUrl(item.imageUrl),
      order: item.sortOrder,
    }));
  }

  async get(id: string) {
    const item = await this.prisma.statusService.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('الخدمة غير موجودة');
    return item;
  }

  async create(dto: CreateStatusServiceDto, actorId: string) {
    const item = await this.prisma.statusService.create({
      data: {
        name: dto.name,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'page_management.status.service',
      resourceId: item.id,
    });
    return item;
  }

  async update(id: string, dto: UpdateStatusServiceDto, actorId: string) {
    await this.get(id);
    const item = await this.prisma.statusService.update({
      where: { id },
      data: {
        name: dto.name,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'page_management.status.service',
      resourceId: item.id,
    });
    return item;
  }

  async remove(id: string, actorId: string) {
    await this.get(id);
    await this.prisma.statusService.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'page_management.status.service',
      resourceId: id,
    });
    return { success: true };
  }
}
