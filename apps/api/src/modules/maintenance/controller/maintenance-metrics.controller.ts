import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { RequirePermissions } from '../../../common/guards';
import { MaintenanceMetricsService } from '../service/maintenance-metrics.service';

@ApiTags('maintenance-metrics')
@ApiBearerAuth()
@Controller('maintenance/metrics')
export class MaintenanceMetricsController {
  constructor(private readonly metrics: MaintenanceMetricsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.MAINTENANCE_READ)
  summary() {
    return this.metrics.summary();
  }
}
