import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaNetworkPagesService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { CreateSpeedOptionDto } from '../dto/create-speed-option.dto';
import { UpdateSpeedOptionDto } from '../dto/update-speed-option.dto';

@Injectable()
export class SpeedOptionsService {
  constructor(
    private readonly prisma: PrismaNetworkPagesService,
    private readonly audit: AuditService,
  ) {}

  listAdmin() {
    return this.prisma.speedOption.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /** للصفحات العامة — نمط الملكي: value / name / default */
  async listPublic() {
    const items = await this.prisma.speedOption.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return items.map((item) => ({
      id: item.id,
      value: item.value,
      name: item.name,
      default: item.isDefault,
      order: item.sortOrder,
    }));
  }

  async get(id: string) {
    const item = await this.prisma.speedOption.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('خيار السرعة غير موجود');
    return item;
  }

  private async clearOtherDefaults(exceptId?: string) {
    await this.prisma.speedOption.updateMany({
      where: exceptId ? { id: { not: exceptId } } : {},
      data: { isDefault: false },
    });
  }

  async create(dto: CreateSpeedOptionDto, actorId: string) {
    if (dto.isDefault) {
      await this.clearOtherDefaults();
    }
    const item = await this.prisma.speedOption.create({
      data: {
        name: dto.name.trim(),
        value: dto.value.trim(),
        isDefault: dto.isDefault ?? false,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'page_management.speed',
      resourceId: item.id,
    });
    return item;
  }

  async update(id: string, dto: UpdateSpeedOptionDto, actorId: string) {
    await this.get(id);
    if (dto.isDefault === true) {
      await this.clearOtherDefaults(id);
    }
    const item = await this.prisma.speedOption.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.value !== undefined ? { value: dto.value.trim() } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'page_management.speed',
      resourceId: item.id,
    });
    return item;
  }

  async remove(id: string, actorId: string) {
    await this.get(id);
    await this.prisma.speedOption.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'page_management.speed',
      resourceId: id,
    });
    return { success: true };
  }
}
