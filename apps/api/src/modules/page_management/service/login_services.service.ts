import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaNetworkPagesService } from '../../../database/database.module';
import { toAbsolutePublicUrl } from '../../../common/public-asset-url';
import { AuditService } from '../../audit/audit.service';
import { CreateLoginServiceDto } from '../dto/create-login-service.dto';
import { UpdateLoginServiceDto } from '../dto/update-login-service.dto';
import { PageCardFlagsService } from './page_card_flags.service';

@Injectable()
export class LoginServicesService {
  constructor(
    private readonly prisma: PrismaNetworkPagesService,
    private readonly audit: AuditService,
    private readonly flags: PageCardFlagsService,
  ) {}

  listAdmin() {
    return this.prisma.loginService.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async listPublic() {
    if (!(await this.flags.isEnabled('login_services'))) return [];
    const items = await this.prisma.loginService.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    // شكل متوافق مع سكربت العميل: name / url / icon (أو icon_url)
    return items
      .filter((item) => item.linkUrl.trim() !== '')
      .map((item) => {
        const icon = toAbsolutePublicUrl(item.imageUrl);
        return {
          name: item.name,
          title: item.name,
          url: item.linkUrl.trim(),
          link: item.linkUrl.trim(),
          icon,
          icon_url: icon,
          image: icon,
          order: item.sortOrder,
        };
      });
  }

  async get(id: string) {
    const item = await this.prisma.loginService.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('الخدمة غير موجودة');
    return item;
  }

  async create(dto: CreateLoginServiceDto, actorId: string) {
    const item = await this.prisma.loginService.create({
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
      resource: 'page_management.login.service',
      resourceId: item.id,
    });
    return item;
  }

  async update(id: string, dto: UpdateLoginServiceDto, actorId: string) {
    await this.get(id);
    const item = await this.prisma.loginService.update({
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
      resource: 'page_management.login.service',
      resourceId: item.id,
    });
    return item;
  }

  async remove(id: string, actorId: string) {
    await this.get(id);
    await this.prisma.loginService.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'page_management.login.service',
      resourceId: id,
    });
    return { success: true };
  }
}
