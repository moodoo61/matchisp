import { Injectable } from '@nestjs/common';
import { PrismaInventoryService } from '../../../database/database.module';
import { InventoryUsersService } from './inventory-users.service';

@Injectable()
export class StockMovementsService {
  constructor(
    private readonly prisma: PrismaInventoryService,
    private readonly users: InventoryUsersService,
  ) {}

  async list(query: { itemId?: string; deviceUnitId?: string; type?: string }) {
    const rows = await this.prisma.stockMovement.findMany({
      where: {
        ...(query.itemId ? { itemId: query.itemId } : {}),
        ...(query.deviceUnitId ? { deviceUnitId: query.deviceUnitId } : {}),
        ...(query.type ? { type: query.type } : {}),
      },
      include: {
        item: { select: { id: true, code: true, name: true, kind: true } },
        deviceUnit: { select: { id: true, serial: true, status: true } },
        document: {
          select: { id: true, number: true, type: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    const users = await this.users.loadMap(rows.map((r) => r.actorId));
    return rows.map((r) => ({
      ...r,
      actor: this.users.brief(users, r.actorId),
    }));
  }
}
