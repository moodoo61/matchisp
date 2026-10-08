import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../../common/guards';
import { UpdateViewingReportsSettingsDto } from '../dto/update-viewing-reports-settings.dto';
import { ViewingReportsService } from '../service/viewing-reports.service';
import { ViewingReportsSettingsService } from '../service/viewing-reports-settings.service';

@ApiTags('live-viewing-reports')
@ApiBearerAuth()
@Controller('live/viewing-reports')
export class ViewingReportsController {
  constructor(
    private readonly reports: ViewingReportsService,
    private readonly settings: ViewingReportsSettingsService,
  ) {}

  @Get('settings')
  @RequirePermissions(PERMISSIONS.LIVE_VIEWING_REPORTS_READ)
  getSettings() {
    return this.settings.getSettings();
  }

  @Patch('settings')
  @RequirePermissions(PERMISSIONS.LIVE_VIEWING_REPORTS_UPDATE)
  updateSettings(
    @Body() dto: UpdateViewingReportsSettingsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.settings.updateSettings(dto, user.id);
  }

  @Get('summary')
  @RequirePermissions(PERMISSIONS.LIVE_VIEWING_REPORTS_READ)
  summary(@Query('hours') hoursRaw?: string) {
    const hours = Number(hoursRaw ?? '24');
    return this.reports.summary(
      Number.isFinite(hours) && hours > 0 ? Math.min(hours, 24 * 90) : 24,
    );
  }

  @Get('by-day')
  @RequirePermissions(PERMISSIONS.LIVE_VIEWING_REPORTS_READ)
  byDay(@Query('hours') hoursRaw?: string) {
    const hours = Number(hoursRaw ?? String(24 * 30));
    return this.reports.byDay(
      Number.isFinite(hours) && hours > 0 ? Math.min(hours, 24 * 90) : 24 * 30,
    );
  }

  @Get('timeline')
  @RequirePermissions(PERMISSIONS.LIVE_VIEWING_REPORTS_READ)
  timeline(@Query('hours') hoursRaw?: string) {
    const hours = Number(hoursRaw ?? '24');
    return this.reports.timeline(
      Number.isFinite(hours) && hours > 0 ? Math.min(hours, 24 * 90) : 24,
    );
  }

  @Get('sessions')
  @RequirePermissions(PERMISSIONS.LIVE_VIEWING_REPORTS_READ)
  list(
    @Query('streamName') streamName?: string,
    @Query('day') day?: string,
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    return this.reports.list({
      streamName,
      day,
      limit: Number(limitRaw ?? '50'),
      offset: Number(offsetRaw ?? '0'),
    });
  }

  @Delete('sessions')
  @RequirePermissions(PERMISSIONS.LIVE_VIEWING_REPORTS_DELETE)
  clear(@CurrentUser() user: RequestUser) {
    return this.reports.clearAll(user.id);
  }
}
