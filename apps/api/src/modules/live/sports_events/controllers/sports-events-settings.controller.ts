import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../../common/guards';
import { UpdateSportsEventsSettingsDto } from '../dto/update-sports-events-settings.dto';
import { SportsEventsSettingsService } from '../service/sports-events-settings.service';

@ApiTags('live-sports-events-settings')
@ApiBearerAuth()
@Controller('live/sports-events/settings')
export class SportsEventsSettingsController {
  constructor(private readonly settings: SportsEventsSettingsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.LIVE_SPORTS_EVENTS_READ)
  get() {
    return this.settings.getSettings();
  }

  @Patch()
  @RequirePermissions(PERMISSIONS.LIVE_SPORTS_EVENTS_UPDATE)
  update(
    @Body() dto: UpdateSportsEventsSettingsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.settings.updateSettings(dto, user.id);
  }
}
