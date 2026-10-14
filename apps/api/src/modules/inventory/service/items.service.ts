import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaInventoryService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { WarehouseService } from './warehouse.service';

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaInventoryService,
    private readonly audit: AuditService,
    private readonly warehouse: WarehouseService,
  ) {}

  async list() {
    const wh = await this.warehouse.getOrCreateMain();
    const rows = await this.prisma.item.findMany({
      include: {
        balances: { where: { warehouseId: wh.id } },
        _count: { select: { devices: true } },
      },
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      kind: r.kind,
      unit: r.unit,
      minQty: r.minQty,
      notes: r.notes,
      active: r.active,
      quantity: r.balances[0]?.quantity ?? 0,
      devicesCount: r._count.devices,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async get(id: string) {
    const wh = await this.warehouse.getOrCreateMain();
    const row = await this.prisma.item.findUnique({
      where: { id },
      include: {
        balances: { where: { warehouseId: wh.id } },
        _count: { select: { devices: true } },
      },
    });
    if (!row) throw new NotFoundException('الصنف غير موجود');
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      kind: row.kind,
      unit: row.unit,
      minQty: row.minQty,
      notes: row.notes,
      active: row.active,
      quantity: row.balances[0]?.quantity ?? 0,
      devicesCount: row._count.devices,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async create(dto: CreateItemDto, actorId: string) {
    const code = dto.code.trim().toUpperCase();
    const dup = await this.prisma.item.findUnique({ where: { code } });
    if (dup) throw new BadRequestException('رمز الصنف مستخدم مسبقاً');

    const wh = await this.warehouse.getOrCreateMain();
    const item = await this.prisma.$transaction(async (tx) => {
      const created = await tx.item.create({
        data: {
          code,
          name: dto.name.trim(),
          kind: dto.kind,
          unit: (dto.unit ?? 'قطعة').trim() || 'قطعة',
          minQty: dto.minQty ?? 0,
          notes: (dto.notes ?? '').trim(),
          active: dto.active ?? true,
        },
      });
      await tx.stockBalance.create({
        data: { warehouseId: wh.id, itemId: created.id, quantity: 0 },
      });
      return created;
    });

    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'inventory.item',
      resourceId: item.id,
      metadata: { code: item.code, name: item.name, kind: item.kind },
    });

    return this.get(item.id);
  }

  async update(id: string, dto: UpdateItemDto, actorId: string) {
    await this.get(id);
    if (dto.code) {
      const code = dto.code.trim().toUpperCase();
      const dup = await this.prisma.item.findFirst({
        where: { code, NOT: { id } },
      });
      if (dup) throw new BadRequestException('رمز الصنف مستخدم مسبقاً');
    }

    const item = await this.prisma.item.update({
      where: { id },
      data: {
        ...(dto.code !== undefined
          ? { code: dto.code.trim().toUpperCase() }
          : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.unit !== undefined
          ? { unit: dto.unit.trim() || 'قطعة' }
          : {}),
        ...(dto.minQty !== undefined ? { minQty: dto.minQty } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes.trim() } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });

    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'inventory.item',
      resourceId: item.id,
      metadata: { fields: Object.keys(dto) },
    });

    return this.get(item.id);
  }
}
