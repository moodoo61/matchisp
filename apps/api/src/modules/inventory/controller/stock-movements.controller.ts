import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { RequirePermissions } from '../../../common/guards';
import { StockMovementsService } from '../service/stock-movements.service';

@ApiTags('inventory-movements')
@ApiBearerAuth()
@Controller('inventory/movements')
export class StockMovementsController {
  constructor(private readonly movements: StockMovementsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  list(
    @Query('itemId') itemId?: string,
    @Query('deviceUnitId') deviceUnitId?: string,
    @Query('type') type?: string,
  ) {
    return this.movements.list({ itemId, deviceUnitId, type });
  }
}
