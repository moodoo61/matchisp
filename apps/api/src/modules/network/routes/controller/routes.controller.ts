import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../../common/guards';
import { SetDefaultRouteDto } from '../dto/set-default-route.dto';
import { RoutesService } from '../service/routes.service';

@ApiTags('network-routes')
@ApiBearerAuth()
@Controller('settings/network/routes')
export class RoutesController {
  constructor(private readonly routes: RoutesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.NETWORK_ROUTES_READ)
  list() {
    return this.routes.list();
  }

  @Post('default')
  @RequirePermissions(PERMISSIONS.NETWORK_ROUTES_MANAGE)
  setDefault(
    @Body() dto: SetDefaultRouteDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.routes.addDefault(dto.gateway, dto.device, user.id);
  }
}
