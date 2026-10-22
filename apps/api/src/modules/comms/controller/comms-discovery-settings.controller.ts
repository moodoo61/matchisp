import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';
import { UpdateCommsDiscoverySettingsDto } from '../dto/update-comms-discovery-settings.dto';
import { CommsDiscoverySettingsService } from '../service/comms-discovery-settings.service';

@ApiTags('comms-discovery')
@ApiBearerAuth()
@Controller('comms/discovery-settings')
export class CommsDiscoverySettingsController {
  constructor(private readonly settings: CommsDiscoverySettingsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.COMMS_READ)
  get() {
    return this.settings.getSettings();
  }

  @Patch()
  @RequirePermissions(PERMISSIONS.COMMS_UPDATE)
  update(
    @Body() dto: UpdateCommsDiscoverySettingsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.settings.updateSettings(dto, user.id);
  }
}
