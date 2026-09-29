import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../../common/guards';
import { CreateSportTeamDto } from '../dto/create-sport-team.dto';
import { UpdateSportTeamDto } from '../dto/update-sport-team.dto';
import { SportTeamsService } from '../service/sport-teams.service';
import {
  SportTeamUploadService,
  sportTeamMulterOptions,
} from '../service/sport-team-upload.service';

@ApiTags('live-sports-events-teams')
@ApiBearerAuth()
@Controller('live/sports-events/teams')
export class SportTeamsController {
  constructor(
    private readonly teams: SportTeamsService,
    private readonly uploads: SportTeamUploadService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.LIVE_SPORTS_EVENTS_READ)
  list() {
    return this.teams.list();
  }

  @Post('upload')
  @RequireAnyPermission(
    PERMISSIONS.LIVE_SPORTS_EVENTS_CREATE,
    PERMISSIONS.LIVE_SPORTS_EVENTS_UPDATE,
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
  @UseInterceptors(FileInterceptor('file', sportTeamMulterOptions))
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('لم يتم اختيار ملف');
    }
    return { logoUrl: this.uploads.toPublicUrl(file.filename) };
  }

  @Post()
  @RequirePermissions(PERMISSIONS.LIVE_SPORTS_EVENTS_CREATE)
  create(@Body() dto: CreateSportTeamDto, @CurrentUser() user: RequestUser) {
    return this.teams.create(dto, user.id);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.LIVE_SPORTS_EVENTS_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.teams.get(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.LIVE_SPORTS_EVENTS_UPDATE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSportTeamDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.teams.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.LIVE_SPORTS_EVENTS_DELETE)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.teams.remove(id, user.id);
  }
}
