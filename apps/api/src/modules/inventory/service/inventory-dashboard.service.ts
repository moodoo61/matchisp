import { Injectable } from '@nestjs/common';
import { PrismaInventoryService } from '../../../database/database.module';
import { WarehouseService } from './warehouse.service';

@Injectable()
export class InventoryDashboardService {
  constructor(
    private readonly prisma: PrismaInventoryService,
    private readonly warehouse: WarehouseService,
  ) {}

  async summary() {
    const wh = await this.warehouse.getOrCreateMain();
    const [items, balances, devicesInStock, devicesIssued, devicesInstalled, lowStock, recentDocs] =
      await Promise.all([
        this.prisma.item.count({ where: { active: true } }),
        this.prisma.stockBalance.findMany({
          where: { warehouseId: wh.id },
          include: { item: true },
        }),
        this.prisma.deviceUnit.count({ where: { status: 'in_stock' } }),
        this.prisma.deviceUnit.count({ where: { status: 'issued' } }),
        this.prisma.deviceUnit.count({ where: { status: 'installed' } }),
        this.prisma.stockBalance.findMany({
          where: { warehouseId: wh.id },
          include: { item: true },
        }),
        this.prisma.stockDocument.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
          select: {
            id: true,
            number: true,
            type: true,
            status: true,
            createdAt: true,
            postedAt: true,
          },
        }),
      ]);

    const totalQty = balances.reduce((s, b) => s + b.quantity, 0);
    const low = lowStock.filter(
      (b) => b.item.active && b.quantity <= b.item.minQty,
    );

    return {
      warehouse: { id: wh.id, name: wh.name },
      activeItems: items,
      totalQuantity: totalQty,
      devicesInStock,
      devicesIssued,
      devicesInstalled,
      lowStockCount: low.length,
      lowStock: low.map((b) => ({
        itemId: b.itemId,
        code: b.item.code,
        name: b.item.name,
        quantity: b.quantity,
        minQty: b.item.minQty,
      })),
      recentDocuments: recentDocs,
    };
  }
}
