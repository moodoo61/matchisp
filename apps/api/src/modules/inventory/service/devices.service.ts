import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaInventoryService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { MarkInstalledDto } from '../dto/mark-installed.dto';
import { InventoryUsersService } from './inventory-users.service';

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaInventoryService,
    private readonly audit: AuditService,
    private readonly users: InventoryUsersService,
  ) {}

  async list(query: {
    itemId?: string;
    status?: string;
    holderUserId?: string;
    workOrderId?: string;
    q?: string;
  }) {
    const q = query.q?.trim();
    const rows = await this.prisma.deviceUnit.findMany({
      where: {
        ...(query.itemId ? { itemId: query.itemId } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.holderUserId ? { holderUserId: query.holderUserId } : {}),
        ...(query.workOrderId ? { workOrderId: query.workOrderId } : {}),
        ...(q
          ? {
              OR: [
                { serial: { contains: q, mode: 'insensitive' } },
                { item: { name: { contains: q, mode: 'insensitive' } } },
                { item: { code: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: { item: true },
      orderBy: [{ updatedAt: 'desc' }],
      take: 300,
    });
    return this.enrichMany(rows);
  }

  async get(id: string) {
    const row = await this.prisma.deviceUnit.findUnique({
      where: { id },
      include: { item: true },
    });
    if (!row) throw new NotFoundException('الجهاز غير موجود');
    const [enriched] = await this.enrichMany([row]);
    return enriched;
  }

  async markInstalled(id: string, dto: MarkInstalledDto, actorId: string) {
    const device = await this.prisma.deviceUnit.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('الجهاز غير موجود');
    if (device.status !== 'issued' && device.status !== 'in_stock') {
      throw new BadRequestException(
        'التركيب متاح للجهاز المصروف أو الموجود في المخزن',
      );
    }

    const updated = await this.prisma.deviceUnit.update({
      where: { id },
      data: {
        status: 'installed',
        installedAssetId: dto.installedAssetId,
        holderUserId: null,
        notes: dto.notes?.trim()
          ? `${device.notes}\n${dto.notes.trim()}`.trim()
          : device.notes,
      },
      include: { item: true },
    });

    await this.audit.log({
      actorId,
      action: 'install',
      resource: 'inventory.device',
      resourceId: id,
      metadata: {
        serial: device.serial,
        installedAssetId: dto.installedAssetId,
      },
    });

    const [enriched] = await this.enrichMany([updated]);
    return enriched;
  }

  async markFaulty(id: string, actorId: string) {
    const device = await this.prisma.deviceUnit.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('الجهاز غير موجود');
    if (device.status === 'scrapped') {
      throw new BadRequestException('الجهاز مستبعد مسبقاً');
    }

    const updated = await this.prisma.deviceUnit.update({
      where: { id },
      data: { status: 'faulty', holderUserId: null },
      include: { item: true },
    });

    await this.audit.log({
      actorId,
      action: 'faulty',
      resource: 'inventory.device',
      resourceId: id,
      metadata: { serial: device.serial },
    });

    const [enriched] = await this.enrichMany([updated]);
    return enriched;
  }

  private async enrichMany(
    rows: Array<{
      id: string;
      itemId: string;
      serial: string;
      status: string;
      holderUserId: string | null;
      workOrderId: string | null;
      installedAssetId: string | null;
      notes: string;
      createdAt: Date;
      updatedAt: Date;
      item: {
        id: string;
        code: string;
        name: string;
        kind: string;
      };
    }>,
  ) {
    const userIds = rows.flatMap((r) =>
      r.holderUserId ? [r.holderUserId] : [],
    );
    const users = await this.users.loadMap(userIds);
    return rows.map((r) => ({
      id: r.id,
      itemId: r.itemId,
      serial: r.serial,
      status: r.status,
      holderUserId: r.holderUserId,
      workOrderId: r.workOrderId,
      installedAssetId: r.installedAssetId,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      item: r.item,
      holder: this.users.brief(users, r.holderUserId),
    }));
  }
}
