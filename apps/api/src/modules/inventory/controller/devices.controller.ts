import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';
import { MarkInstalledDto } from '../dto/mark-installed.dto';
import { QueryDevicesDto } from '../dto/query-devices.dto';
import { DevicesService } from '../service/devices.service';

@ApiTags('inventory-devices')
@ApiBearerAuth()
@Controller('inventory/devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  list(@Query() query: QueryDevicesDto) {
    return this.devices.list(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.devices.get(id);
  }

  @Post(':id/install')
  @RequireAnyPermission(
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.INVENTORY_ISSUE,
  )
  install(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkInstalledDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.devices.markInstalled(id, dto, user.id);
  }

  @Post(':id/faulty')
  @RequireAnyPermission(
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.INVENTORY_ISSUE,
  )
  faulty(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.devices.markFaulty(id, user.id);
  }
}
