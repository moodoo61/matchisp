import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { hasPermission, PERMISSIONS } from '@isp/shared';
import { ChannelsService } from '../service/channels/channels.service';
import { ChannelsOverviewService } from '../service/channels/channels-overview.service';
import {
  ChannelUploadService,
  channelMulterOptions,
} from '../service/channels/channel_upload.service';
import { CreateChannelDto } from '../dto/channels/create-channel.dto';
import { UpdateChannelDto } from '../dto/channels/update-channel.dto';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';

function definedKeys(dto: UpdateChannelDto): string[] {
  return Object.entries(dto)
    .filter(([, value]) => value !== undefined)
    .map(([key]) => key);
}

@ApiTags('live-channels')
@ApiBearerAuth()
@Controller('live/channels')
export class ChannelsController {
  constructor(
    private readonly channels: ChannelsService,
    private readonly overview: ChannelsOverviewService,
    private readonly uploads: ChannelUploadService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.LIVE_CHANNELS_READ)
  list() {
    return this.channels.list();
  }

  @Get('overview')
  @RequirePermissions(PERMISSIONS.LIVE_CHANNELS_READ)
  getOverview() {
    return this.overview.getOverview();
  }

  @Post('upload')
  @RequireAnyPermission(
    PERMISSIONS.LIVE_CHANNELS_CREATE,
    PERMISSIONS.LIVE_CHANNELS_UPDATE,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', channelMulterOptions))
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('لم يتم اختيار ملف');
    }
    return { imageUrl: this.uploads.toPublicUrl(file.filename) };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.LIVE_CHANNELS_READ)
  get(@Param('id') id: string) {
    return this.channels.get(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.LIVE_CHANNELS_CREATE)
  create(@Body() dto: CreateChannelDto, @CurrentUser() user: RequestUser) {
    return this.channels.create(dto, user.id);
  }

  @Patch(':id')
  @RequireAnyPermission(
    PERMISSIONS.LIVE_CHANNELS_UPDATE,
    PERMISSIONS.LIVE_CHANNELS_TOGGLE,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateChannelDto,
    @CurrentUser() user: RequestUser,
  ) {
    const keys = definedKeys(dto);
    const onlyAlwaysOn = keys.length === 1 && keys[0] === 'alwaysOn';
    if (onlyAlwaysOn) {
      if (!hasPermission(user.permissions, PERMISSIONS.LIVE_CHANNELS_TOGGLE)) {
        throw new ForbiddenException('لا تملك صلاحية تفعيل/تعطيل التشغيل الدائم');
      }
    } else if (!hasPermission(user.permissions, PERMISSIONS.LIVE_CHANNELS_UPDATE)) {
      throw new ForbiddenException('لا تملك صلاحية تعديل القناة');
    }
    return this.channels.update(id, dto, user.id);
  }

  @Post(':id/stop-sessions')
  @RequirePermissions(PERMISSIONS.LIVE_CHANNELS_CONTROL)
  stopSessions(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.channels.stopSessions(id, user.id);
  }

  @Post(':id/nuke-stream')
  @RequirePermissions(PERMISSIONS.LIVE_CHANNELS_CONTROL)
  nukeStream(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.channels.nukeStream(id, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.LIVE_CHANNELS_DELETE)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.channels.remove(id, user.id);
  }
}
