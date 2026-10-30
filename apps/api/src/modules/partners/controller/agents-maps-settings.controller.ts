import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';
import { UpdateAgentsMapsSettingsDto } from '../dto/update-agents-maps-settings.dto';
import { AgentsMapsSettingsService } from '../service/agents-maps-settings.service';

@ApiTags('partners')
@ApiBearerAuth()
@Controller('partners/agents/maps-settings')
export class AgentsMapsSettingsController {
  constructor(private readonly settings: AgentsMapsSettingsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PARTNERS_READ)
  get() {
    return this.settings.getSettings();
  }

  @Patch()
  @RequirePermissions(PERMISSIONS.PARTNERS_UPDATE)
  update(
    @Body() dto: UpdateAgentsMapsSettingsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.settings.updateSettings(dto, user.id);
  }
}
