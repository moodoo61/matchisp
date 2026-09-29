import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { ChannelSectionsService } from '../service/channel-sections/channel_sections.service';
import { CreateChannelSectionDto } from '../dto/channel-sections/create-channel-section.dto';
import { UpdateChannelSectionDto } from '../dto/channel-sections/update-channel-section.dto';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';

@ApiTags('live-channel-sections')
@ApiBearerAuth()
@Controller('live/channel-sections')
export class ChannelSectionsController {
  constructor(private readonly sections: ChannelSectionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.LIVE_CHANNELS_READ)
  list() {
    return this.sections.list();
  }

  @Post()
  @RequirePermissions(PERMISSIONS.LIVE_CHANNELS_CREATE)
  create(
    @Body() dto: CreateChannelSectionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.sections.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.LIVE_CHANNELS_UPDATE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateChannelSectionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.sections.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.LIVE_CHANNELS_DELETE)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.sections.remove(id, user.id);
  }
}
