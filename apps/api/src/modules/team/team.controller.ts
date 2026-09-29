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
import { TeamService } from './team.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './team.dto';
import { CurrentUser, RequirePermissions, type RequestUser } from '../../common/guards';

@ApiTags('team')
@ApiBearerAuth()
@Controller('team')
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.TEAM_READ)
  list() {
    return this.team.list();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.TEAM_READ)
  get(@Param('id') id: string) {
    return this.team.get(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.TEAM_CREATE)
  create(@Body() dto: CreateTeamMemberDto, @CurrentUser() user: RequestUser) {
    return this.team.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.TEAM_UPDATE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTeamMemberDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.team.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.TEAM_DELETE)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.team.remove(id, user.id);
  }
}
