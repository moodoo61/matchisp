import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';
import { UpdateAgentsPublicApiSettingsDto } from '../dto/update-agents-public-api-settings.dto';
import { AgentsPublicApiSettingsService } from '../service/agents-public-api-settings.service';

@ApiTags('partners')
@ApiBearerAuth()
@Controller('partners/agents/public-api-settings')
export class AgentsPublicApiSettingsController {
  constructor(private readonly settings: AgentsPublicApiSettingsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PARTNERS_READ)
  get() {
    return this.settings.getSettings();
  }

  @Patch()
  @RequirePermissions(PERMISSIONS.PARTNERS_UPDATE)
  update(
    @Body() dto: UpdateAgentsPublicApiSettingsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.settings.updateSettings(dto, user.id);
  }
}
