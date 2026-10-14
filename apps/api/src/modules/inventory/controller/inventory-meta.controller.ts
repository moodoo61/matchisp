import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { RequirePermissions } from '../../../common/guards';
import {
  DEVICE_STATUS_LABELS,
  DEVICE_STATUSES,
} from '../constants/device-status';
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUSES,
} from '../constants/document-status';
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES,
} from '../constants/document-type';
import { ITEM_KIND_LABELS, ITEM_KINDS } from '../constants/item-kind';
import { InventoryDashboardService } from '../service/inventory-dashboard.service';
import { InventoryUsersService } from '../service/inventory-users.service';
import { WarehouseService } from '../service/warehouse.service';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryMetaController {
  constructor(
    private readonly dashboard: InventoryDashboardService,
    private readonly users: InventoryUsersService,
    private readonly warehouse: WarehouseService,
  ) {}

  @Get('meta/kinds')
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  kinds() {
    return ITEM_KINDS.map((value) => ({
      value,
      label: ITEM_KIND_LABELS[value],
    }));
  }

  @Get('meta/device-statuses')
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  deviceStatuses() {
    return DEVICE_STATUSES.map((value) => ({
      value,
      label: DEVICE_STATUS_LABELS[value],
    }));
  }

  @Get('meta/document-types')
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  documentTypes() {
    return DOCUMENT_TYPES.map((value) => ({
      value,
      label: DOCUMENT_TYPE_LABELS[value],
    }));
  }

  @Get('meta/document-statuses')
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  documentStatuses() {
    return DOCUMENT_STATUSES.map((value) => ({
      value,
      label: DOCUMENT_STATUS_LABELS[value],
    }));
  }

  @Get('meta/members')
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  members() {
    return this.users.listMembers();
  }

  @Get('warehouse')
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  warehouseInfo() {
    return this.warehouse.getOrCreateMain();
  }

  @Get('summary')
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  summary() {
    return this.dashboard.summary();
  }
}
