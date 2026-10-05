import { Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../../common/guards';
import { UpdatesService } from '../service/updates.service';

@ApiTags('settings-updates')
@ApiBearerAuth()
@Controller('settings/updates')
export class UpdatesController {
  constructor(private readonly updates: UpdatesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SETTINGS_UPDATES_READ)
  status() {
    return this.updates.getStatus({ fetch: false });
  }

  @Post('check')
  @RequirePermissions(PERMISSIONS.SETTINGS_UPDATES_READ)
  check(@CurrentUser() user: RequestUser) {
    return this.updates.check(user.id);
  }

  @Post('apply')
  @RequirePermissions(PERMISSIONS.SETTINGS_UPDATES_APPLY)
  apply(@CurrentUser() user: RequestUser) {
    return this.updates.apply(user.id);
  }
}
