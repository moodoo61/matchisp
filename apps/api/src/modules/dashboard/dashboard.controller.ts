import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { DashboardService } from './dashboard.service';
import { RequirePermissions } from '../../common/guards';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('overview')
  @RequirePermissions(PERMISSIONS.DASHBOARD_READ)
  overview() {
    return this.dashboard.overview();
  }
}
