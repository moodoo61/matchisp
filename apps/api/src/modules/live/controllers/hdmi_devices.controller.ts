import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { HdmiDevicesService } from '../service/hdmi/hdmi_devices.service';
import { RequireAnyPermission } from '../../../common/guards';

@ApiTags('live-hdmi-devices')
@ApiBearerAuth()
@Controller('live/hdmi-devices')
export class HdmiDevicesController {
  constructor(private readonly devices: HdmiDevicesService) {}

  @Get()
  @RequireAnyPermission(
    PERMISSIONS.LIVE_CHANNELS_CREATE,
    PERMISSIONS.LIVE_CHANNELS_UPDATE,
  )
  list(@Query('exceptChannelId') exceptChannelId?: string) {
    return this.devices.listAvailable(exceptChannelId);
  }
}
