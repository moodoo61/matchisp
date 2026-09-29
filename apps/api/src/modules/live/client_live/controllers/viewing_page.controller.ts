import { Body, Controller, ForbiddenException, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { hasPermission, PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../../common/guards';
import { UpdateViewingPageDto } from '../dto/update-viewing-page.dto';
import { ViewingPageService } from '../service/viewing_page.service';

@ApiTags('live-viewing-page')
@ApiBearerAuth()
@Controller('live/viewing-page')
export class ViewingPageController {
  constructor(private readonly viewingPage: ViewingPageService) {}

  @Get('settings')
  @RequirePermissions(PERMISSIONS.LIVE_VIEWING_PAGE_READ)
  getSettings() {
    return this.viewingPage.getSettings();
  }

  @Patch('settings')
  @RequireAnyPermission(
    PERMISSIONS.LIVE_VIEWING_PAGE_UPDATE,
    PERMISSIONS.LIVE_VIEWING_PAGE_TOGGLE,
  )
  updateSettings(
    @Body() dto: UpdateViewingPageDto,
    @CurrentUser() user: RequestUser,
  ) {
    const keys = Object.entries(dto)
      .filter(([, value]) => value !== undefined)
      .map(([key]) => key);
    const onlyEnabled = keys.length === 1 && keys[0] === 'enabled';
    if (onlyEnabled) {
      if (
        !hasPermission(user.permissions, PERMISSIONS.LIVE_VIEWING_PAGE_TOGGLE)
      ) {
        throw new ForbiddenException('لا تملك صلاحية تفعيل/إيقاف الصفحة');
      }
    } else if (
      !hasPermission(user.permissions, PERMISSIONS.LIVE_VIEWING_PAGE_UPDATE)
    ) {
      throw new ForbiddenException('لا تملك صلاحية تعديل إعدادات الصفحة');
    }
    return this.viewingPage.updateSettings(dto, user.id);
  }
}
