import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../../common/guards';
import { CreateSportMatchDto } from '../dto/create-sport-match.dto';
import { UpdateSportMatchDto } from '../dto/update-sport-match.dto';
import { SportMatchesExternalSyncService } from '../service/sport-matches-external-sync.service';
import { SportMatchesService } from '../service/sport-matches.service';

@ApiTags('live-sports-events-matches')
@ApiBearerAuth()
@Controller('live/sports-events/matches')
export class SportMatchesController {
  constructor(
    private readonly matches: SportMatchesService,
    private readonly externalSync: SportMatchesExternalSyncService,
  ) {}

  @Get('today')
  @RequirePermissions(PERMISSIONS.LIVE_SPORTS_EVENTS_READ)
  listToday() {
    return this.matches.listToday();
  }

  @Post('sync-external')
  @RequirePermissions(PERMISSIONS.LIVE_SPORTS_EVENTS_UPDATE)
  syncExternal(@CurrentUser() user: RequestUser) {
    return this.externalSync.syncNow(user.id);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.LIVE_SPORTS_EVENTS_READ)
  list() {
    return this.matches.list();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.LIVE_SPORTS_EVENTS_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.matches.get(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.LIVE_SPORTS_EVENTS_CREATE)
  create(@Body() dto: CreateSportMatchDto, @CurrentUser() user: RequestUser) {
    return this.matches.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.LIVE_SPORTS_EVENTS_UPDATE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSportMatchDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.matches.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.LIVE_SPORTS_EVENTS_DELETE)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.matches.remove(id, user.id);
  }
}
