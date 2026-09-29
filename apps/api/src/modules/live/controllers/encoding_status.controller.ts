import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';
import { UpdateEncodingQualityDto } from '../dto/encoding/update-encoding-quality.dto';
import { UpdateEncodingSettingsDto } from '../dto/encoding/update-encoding-settings.dto';
import { EncodingQualityService } from '../service/encoding/quality/encoding-quality.service';
import { EncodingSettingsService } from '../service/encoding/encoding-settings.service';
import { EncodingStatusService } from '../service/encoding/encoding-status.service';

@ApiTags('live-encoding')
@ApiBearerAuth()
@Controller('live/encoding')
export class EncodingStatusController {
  constructor(
    private readonly status: EncodingStatusService,
    private readonly settings: EncodingSettingsService,
    private readonly quality: EncodingQualityService,
  ) {}

  @Get('status')
  @RequirePermissions(PERMISSIONS.LIVE_ENCODING_READ)
  getStatus() {
    return this.status.getStatus();
  }

  @Get('settings')
  @RequirePermissions(PERMISSIONS.LIVE_ENCODING_READ)
  getSettings() {
    return this.settings.getSettings();
  }

  @Get('quality')
  @RequirePermissions(PERMISSIONS.LIVE_ENCODING_READ)
  getQuality() {
    return this.quality.getQuality();
  }

  @Get('source-options')
  @RequirePermissions(PERMISSIONS.LIVE_CHANNELS_READ)
  listAvailableSourceOptions() {
    return this.settings.listAvailableSourceOptions();
  }

  @Patch('settings')
  @RequirePermissions(PERMISSIONS.LIVE_ENCODING_UPDATE)
  updateSettings(
    @Body() dto: UpdateEncodingSettingsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.settings.updateSettings(dto, user.id);
  }

  @Patch('quality')
  @RequirePermissions(PERMISSIONS.LIVE_ENCODING_UPDATE)
  updateQuality(
    @Body() dto: UpdateEncodingQualityDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.quality.updateQuality(dto, user.id);
  }
}
