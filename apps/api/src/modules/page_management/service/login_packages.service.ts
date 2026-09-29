import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaNetworkPagesService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { CreateLoginPackageDto } from '../dto/create-login-package.dto';
import { UpdateLoginPackageDto } from '../dto/update-login-package.dto';
import { PageCardFlagsService } from './page_card_flags.service';

type PackageRow = {
  id: string;
  name: string;
  price: { toString(): string } | number | string;
  time: string;
  download: string;
  validity: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function serializePackage(item: PackageRow) {
  return {
    ...item,
    price: Number(item.price),
  };
}

@Injectable()
export class LoginPackagesService {
  constructor(
    private readonly prisma: PrismaNetworkPagesService,
    private readonly audit: AuditService,
    private readonly flags: PageCardFlagsService,
  ) {}

  async listAdmin() {
    const items = await this.prisma.loginPackage.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return items.map(serializePackage);
  }

  async listPublic() {
    if (!(await this.flags.isEnabled('login_packages'))) return [];
    const items = await this.prisma.loginPackage.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      time: item.time,
      download: item.download,
      validity: item.validity,
      order: item.sortOrder,
    }));
  }

  async get(id: string) {
    const item = await this.prisma.loginPackage.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('الباقة غير موجودة');
    return serializePackage(item);
  }

  async create(dto: CreateLoginPackageDto, actorId: string) {
    const item = await this.prisma.loginPackage.create({
      data: {
        name: dto.name,
        price: dto.price,
        time: dto.time,
        download: dto.download,
        validity: dto.validity,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'page_management.login.package',
      resourceId: item.id,
    });
    return serializePackage(item);
  }

  async update(id: string, dto: UpdateLoginPackageDto, actorId: string) {
    await this.get(id);
    const item = await this.prisma.loginPackage.update({
      where: { id },
      data: {
        name: dto.name,
        price: dto.price,
        time: dto.time,
        download: dto.download,
        validity: dto.validity,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'page_management.login.package',
      resourceId: item.id,
    });
    return serializePackage(item);
  }

  async remove(id: string, actorId: string) {
    await this.get(id);
    await this.prisma.loginPackage.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'page_management.login.package',
      resourceId: id,
    });
    return { success: true };
  }
}
