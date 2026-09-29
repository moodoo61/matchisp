import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../../common/guards';
import { UpdateViewingChannelVisibilityDto } from '../dto/update-viewing-channel-visibility.dto';
import { ViewingChannelsService } from '../service/viewing_channels.service';

@ApiTags('live-viewing-page')
@ApiBearerAuth()
@Controller('live/viewing-page/channels')
export class ViewingChannelsController {
  constructor(private readonly channels: ViewingChannelsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.LIVE_VIEWING_PAGE_READ)
  list() {
    return this.channels.listForAdmin();
  }

  @Patch(':id/visibility')
  @RequirePermissions(PERMISSIONS.LIVE_VIEWING_PAGE_TOGGLE)
  setVisibility(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateViewingChannelVisibilityDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.channels.setVisibility(id, dto, user.id);
  }
}
