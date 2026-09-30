import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../../common/guards';
import { UpdateSstpSettingsDto } from '../dto/update-sstp-settings.dto';
import { SstpConnectionService } from '../service/sstp-connection.service';
import { SstpSettingsService } from '../service/sstp-settings.service';

@ApiTags('network-sstp')
@ApiBearerAuth()
@Controller('settings/network/sstp')
export class SstpController {
  constructor(
    private readonly settings: SstpSettingsService,
    private readonly connection: SstpConnectionService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.NETWORK_SSTP_READ)
  status() {
    return this.connection.status();
  }

  @Patch()
  @RequirePermissions(PERMISSIONS.NETWORK_SSTP_MANAGE)
  update(
    @Body() dto: UpdateSstpSettingsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.settings.update(dto, user.id);
  }

  @Post('connect')
  @RequirePermissions(PERMISSIONS.NETWORK_SSTP_MANAGE)
  connect(@CurrentUser() user: RequestUser) {
    return this.connection.connect(user.id);
  }

  @Post('disconnect')
  @RequirePermissions(PERMISSIONS.NETWORK_SSTP_MANAGE)
  disconnect(@CurrentUser() user: RequestUser) {
    return this.connection.disconnect(user.id);
  }
}
