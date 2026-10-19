import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaNetworkPagesService } from '../../../database/database.module';
import { toAbsolutePublicUrl } from '../../../common/public-asset-url';
import { AuditService } from '../../audit/audit.service';
import { CreateLoginFeatureDto } from '../dto/create-login-feature.dto';
import { UpdateLoginFeatureDto } from '../dto/update-login-feature.dto';
import { PageCardFlagsService } from './page_card_flags.service';

@Injectable()
export class LoginFeaturesService {
  constructor(
    private readonly prisma: PrismaNetworkPagesService,
    private readonly audit: AuditService,
    private readonly flags: PageCardFlagsService,
  ) {}

  listAdmin() {
    return this.prisma.loginFeature.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async listPublic() {
    if (!(await this.flags.isEnabled('login_features'))) return [];
    const items = await this.prisma.loginFeature.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return items.map((item) => ({
      id: item.id,
      title: item.title,
      icon: item.icon,
      imageUrl: toAbsolutePublicUrl(item.imageUrl),
      order: item.sortOrder,
    }));
  }

  async get(id: string) {
    const item = await this.prisma.loginFeature.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('الميزة غير موجودة');
    return item;
  }

  async create(dto: CreateLoginFeatureDto, actorId: string) {
    const item = await this.prisma.loginFeature.create({
      data: {
        title: dto.title.trim(),
        icon: dto.icon?.trim() ?? '',
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'page_management.login.features',
      resourceId: item.id,
    });
    return item;
  }

  async update(id: string, dto: UpdateLoginFeatureDto, actorId: string) {
    await this.get(id);
    const item = await this.prisma.loginFeature.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.icon !== undefined ? { icon: dto.icon.trim() } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'page_management.login.features',
      resourceId: item.id,
    });
    return item;
  }

  async remove(id: string, actorId: string) {
    await this.get(id);
    await this.prisma.loginFeature.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'page_management.login.features',
      resourceId: id,
    });
    return { success: true };
  }
}
