import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequireAnyPermission,
  type RequestUser,
} from '../../../common/guards';
import { MaintenanceNotificationsService } from '../service/maintenance-notifications.service';

@ApiTags('maintenance-notifications')
@ApiBearerAuth()
@Controller('maintenance/notifications')
export class MaintenanceNotificationsController {
  constructor(private readonly notifications: MaintenanceNotificationsService) {}

  @Get()
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_READ,
    PERMISSIONS.MAINTENANCE_EXECUTE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  list(@CurrentUser() user: RequestUser) {
    return this.notifications.listForUser(user.id);
  }

  @Get('unread-count')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_READ,
    PERMISSIONS.MAINTENANCE_EXECUTE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  unread(@CurrentUser() user: RequestUser) {
    return this.notifications.unreadCount(user.id);
  }

  @Post(':id/read')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_READ,
    PERMISSIONS.MAINTENANCE_EXECUTE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.notifications.markRead(id, user.id);
  }

  @Post('read-all')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_READ,
    PERMISSIONS.MAINTENANCE_EXECUTE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  markAll(@CurrentUser() user: RequestUser) {
    return this.notifications.markAllRead(user.id);
  }
}
