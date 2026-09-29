import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaNetworkPagesService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { CreateTextAdDto } from '../dto/create-text-ad.dto';
import { UpdateTextAdDto } from '../dto/update-text-ad.dto';
import { PageCardFlagsService } from './page_card_flags.service';

@Injectable()
export class LoginTextAdsService {
  constructor(
    private readonly prisma: PrismaNetworkPagesService,
    private readonly audit: AuditService,
    private readonly flags: PageCardFlagsService,
  ) {}

  listAdmin() {
    return this.prisma.textAd.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async listPublic() {
    if (!(await this.flags.isEnabled('login_ticker'))) return [];
    const items = await this.prisma.textAd.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return items.map((item) => item.text);
  }

  async get(id: string) {
    const item = await this.prisma.textAd.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('إعلان النص غير موجود');
    return item;
  }

  async create(dto: CreateTextAdDto, actorId: string) {
    const item = await this.prisma.textAd.create({
      data: {
        text: dto.text,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'page_management.login.text_ad',
      resourceId: item.id,
    });
    return item;
  }

  async update(id: string, dto: UpdateTextAdDto, actorId: string) {
    await this.get(id);
    const item = await this.prisma.textAd.update({
      where: { id },
      data: {
        text: dto.text,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'page_management.login.text_ad',
      resourceId: item.id,
    });
    return item;
  }

  async remove(id: string, actorId: string) {
    await this.get(id);
    await this.prisma.textAd.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'page_management.login.text_ad',
      resourceId: id,
    });
    return { success: true };
  }
}
