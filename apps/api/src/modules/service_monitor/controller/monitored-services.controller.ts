import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';
import { UpdateMonitoredServiceDto } from '../dto/update-monitored-service.dto';
import { MonitoredServicesService } from '../service/monitored-services.service';
import { ServiceProbeService } from '../service/service-probe.service';

@ApiTags('service-monitor')
@ApiBearerAuth()
@Controller('service-monitor/services')
export class MonitoredServicesController {
  constructor(
    private readonly services: MonitoredServicesService,
    private readonly probe: ServiceProbeService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SERVICE_MONITOR_READ)
  list() {
    return this.services.list();
  }

  @Get(':key')
  @RequirePermissions(PERMISSIONS.SERVICE_MONITOR_READ)
  get(@Param('key') key: string) {
    return this.services.getByKey(key);
  }

  @Get(':key/status')
  @RequirePermissions(PERMISSIONS.SERVICE_MONITOR_READ)
  status(@Param('key') key: string) {
    return this.probe.probe(key);
  }

  @Patch(':key')
  @RequirePermissions(PERMISSIONS.SERVICE_MONITOR_UPDATE)
  update(
    @Param('key') key: string,
    @Body() dto: UpdateMonitoredServiceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.services.updateByKey(key, dto, user.id);
  }
}
