import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';
import { ASSET_KIND_LABELS, ASSET_KINDS } from '../constants/asset-kind';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { AssetsService } from '../service/assets.service';

@ApiTags('maintenance-assets')
@ApiBearerAuth()
@Controller('maintenance/assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Get('meta/kinds')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_READ)
  kinds() {
    return ASSET_KINDS.map((value) => ({
      value,
      label: ASSET_KIND_LABELS[value],
    }));
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MAINTENANCE_READ)
  list() {
    return this.assets.list();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.assets.get(id);
  }

  @Post()
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_TRIAGE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  create(@Body() dto: CreateAssetDto, @CurrentUser() user: RequestUser) {
    return this.assets.create(dto, user.id);
  }
}
