import { Injectable } from '@nestjs/common';
import { PrismaInventoryService } from '../../../database/database.module';

const MAIN_WAREHOUSE_NAME = 'المخزن الرئيسي';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaInventoryService) {}

  /** يضمن وجود المخزن الوحيد ويعيده */
  async getOrCreateMain() {
    const existing = await this.prisma.warehouse.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (existing) return existing;
    return this.prisma.warehouse.create({
      data: { name: MAIN_WAREHOUSE_NAME },
    });
  }
}
