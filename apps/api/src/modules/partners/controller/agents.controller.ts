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
} from '../../../common/guards';
import { CreateAgentDto } from '../dto/create-agent.dto';
import { UpdateAgentDto } from '../dto/update-agent.dto';
import { AgentsService } from '../service/agents.service';

@ApiTags('partners')
@ApiBearerAuth()
@Controller('partners/agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PARTNERS_READ)
  list() {
    return this.agents.list();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PARTNERS_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.agents.get(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PARTNERS_CREATE)
  create(@Body() dto: CreateAgentDto, @CurrentUser() user: RequestUser) {
    return this.agents.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PARTNERS_UPDATE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.agents.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PARTNERS_DELETE)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.agents.remove(id, user.id);
  }
}
