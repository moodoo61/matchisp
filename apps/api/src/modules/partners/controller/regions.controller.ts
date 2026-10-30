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
import { CreateRegionDto } from '../dto/create-region.dto';
import { UpdateRegionDto } from '../dto/update-region.dto';
import { RegionsService } from '../service/regions.service';

@ApiTags('partners')
@ApiBearerAuth()
@Controller('partners/regions')
export class RegionsController {
  constructor(private readonly regions: RegionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PARTNERS_READ)
  list() {
    return this.regions.list();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PARTNERS_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.regions.get(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PARTNERS_CREATE)
  create(@Body() dto: CreateRegionDto, @CurrentUser() user: RequestUser) {
    return this.regions.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PARTNERS_UPDATE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRegionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.regions.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PARTNERS_DELETE)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.regions.remove(id, user.id);
  }
}
