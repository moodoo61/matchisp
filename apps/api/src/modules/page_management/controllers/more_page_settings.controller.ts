import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { MorePageSettingsService } from '../service/more_page_settings.service';
import { UpdateMorePageSettingsDto } from '../dto/update-more-page-settings.dto';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';

@ApiTags('page-management-more-settings')
@ApiBearerAuth()
@Controller('pages/more/settings')
export class MorePageSettingsController {
  constructor(private readonly settings: MorePageSettingsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PAGE_MORE_SETTINGS_READ)
  get() {
    return this.settings.get();
  }

  @Patch()
  @RequireAnyPermission(
    PERMISSIONS.PAGE_MORE_SETTINGS_UPDATE,
    PERMISSIONS.PAGE_MORE_SETTINGS_MANAGE,
  )
  update(
    @Body() dto: UpdateMorePageSettingsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.settings.update(dto, user.id);
  }
}
