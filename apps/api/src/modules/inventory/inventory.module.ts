import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DevicesController } from './controller/devices.controller';
import { InventoryMetaController } from './controller/inventory-meta.controller';
import { ItemsController } from './controller/items.controller';
import { StockDocumentsController } from './controller/stock-documents.controller';
import { StockMovementsController } from './controller/stock-movements.controller';
import { DevicesService } from './service/devices.service';
import { InventoryDashboardService } from './service/inventory-dashboard.service';
import { InventoryUsersService } from './service/inventory-users.service';
import { ItemsService } from './service/items.service';
import { StockDocumentsService } from './service/stock-documents.service';
import { StockMovementsService } from './service/stock-movements.service';
import { WarehouseService } from './service/warehouse.service';

@Module({
  imports: [AuditModule],
  controllers: [
    InventoryMetaController,
    ItemsController,
    DevicesController,
    StockDocumentsController,
    StockMovementsController,
  ],
  providers: [
    WarehouseService,
    InventoryUsersService,
    ItemsService,
    DevicesService,
    StockDocumentsService,
    StockMovementsService,
    InventoryDashboardService,
  ],
  exports: [StockDocumentsService, DevicesService],
})
export class InventoryModule {}
