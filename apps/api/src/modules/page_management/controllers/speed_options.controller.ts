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
import { SpeedOptionsService } from '../service/speed_options.service';
import { CreateSpeedOptionDto } from '../dto/create-speed-option.dto';
import { UpdateSpeedOptionDto } from '../dto/update-speed-option.dto';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';

@ApiTags('page-management-speed')
@ApiBearerAuth()
@Controller('pages/speed')
export class SpeedOptionsController {
  constructor(private readonly speeds: SpeedOptionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PAGE_SPEED_READ)
  list() {
    return this.speeds.listAdmin();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PAGE_SPEED_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.speeds.get(id);
  }

  @Post()
  @RequireAnyPermission(
    PERMISSIONS.PAGE_SPEED_UPDATE,
    PERMISSIONS.PAGE_SPEED_MANAGE,
  )
  create(
    @Body() dto: CreateSpeedOptionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.speeds.create(dto, user.id);
  }

  @Patch(':id')
  @RequireAnyPermission(
    PERMISSIONS.PAGE_SPEED_UPDATE,
    PERMISSIONS.PAGE_SPEED_MANAGE,
  )
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSpeedOptionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.speeds.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequireAnyPermission(
    PERMISSIONS.PAGE_SPEED_UPDATE,
    PERMISSIONS.PAGE_SPEED_MANAGE,
  )
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.speeds.remove(id, user.id);
  }
}
