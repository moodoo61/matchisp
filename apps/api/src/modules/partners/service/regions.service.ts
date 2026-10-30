import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaPartnersService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { CreateRegionDto } from '../dto/create-region.dto';
import { UpdateRegionDto } from '../dto/update-region.dto';

const DEFAULT_REGION_NAME = 'أخرى';

@Injectable()
export class RegionsService {
  constructor(
    private readonly prisma: PrismaPartnersService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    await this.syncFromAgents();
    return this.prisma.region.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async get(id: string) {
    const region = await this.prisma.region.findUnique({ where: { id } });
    if (!region) throw new NotFoundException('المنطقة غير موجودة');
    return region;
  }

  async create(dto: CreateRegionDto, actorId: string) {
    const name = dto.name.trim();
    if (!name) throw new ConflictException('اسم المنطقة مطلوب');

    const existing = await this.prisma.region.findUnique({ where: { name } });
    if (existing) throw new ConflictException('المنطقة موجودة مسبقاً');

    const region = await this.prisma.region.create({
      data: {
        name,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'partners.region',
      resourceId: region.id,
      metadata: {
        name: region.name,
        hasLocation: region.latitude != null && region.longitude != null,
      },
    });

    return region;
  }

  async update(id: string, dto: UpdateRegionDto, actorId: string) {
    const current = await this.get(id);
    const nextName =
      dto.name !== undefined ? dto.name.trim() || current.name : current.name;

    if (nextName !== current.name) {
      const clash = await this.prisma.region.findUnique({
        where: { name: nextName },
      });
      if (clash) throw new ConflictException('المنطقة موجودة مسبقاً');
    }

    const region = await this.prisma.region.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? nextName : undefined,
        ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
        ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });

    if (nextName !== current.name) {
      await this.prisma.agent.updateMany({
        where: { region: current.name },
        data: { region: nextName },
      });
    }

    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'partners.region',
      resourceId: region.id,
      metadata: { fields: Object.keys(dto), from: current.name, to: nextName },
    });

    return region;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.get(id);
    if (existing.name === DEFAULT_REGION_NAME) {
      throw new ConflictException('لا يمكن حذف المنطقة الافتراضية');
    }

    const inUse = await this.prisma.agent.count({
      where: { region: existing.name },
    });
    if (inUse > 0) {
      await this.prisma.agent.updateMany({
        where: { region: existing.name },
        data: { region: DEFAULT_REGION_NAME },
      });
      await this.ensureDefaultRegion();
    }

    await this.prisma.region.delete({ where: { id } });

    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'partners.region',
      resourceId: id,
      metadata: { name: existing.name, reassignedAgents: inUse },
    });

    return { success: true };
  }

  /** يضمن وجود المناطق المستخدمة في الوكلاء ضمن جدول المناطق */
  private async syncFromAgents() {
    await this.ensureDefaultRegion();

    const rows = await this.prisma.agent.findMany({
      select: { region: true },
      distinct: ['region'],
    });

    for (const row of rows) {
      const name = row.region.trim() || DEFAULT_REGION_NAME;
      await this.prisma.region.upsert({
        where: { name },
        create: { name, sortOrder: name === DEFAULT_REGION_NAME ? 9999 : 0 },
        update: {},
      });
    }
  }

  private async ensureDefaultRegion() {
    await this.prisma.region.upsert({
      where: { name: DEFAULT_REGION_NAME },
      create: { name: DEFAULT_REGION_NAME, sortOrder: 9999 },
      update: {},
    });
  }
}
