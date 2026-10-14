import {
  Body,
  Controller,
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
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';
import { CreatePartsRequestDto } from '../dto/create-parts-request.dto';
import { UpdatePartsRequestDto } from '../dto/update-parts-request.dto';
import { rolesFromPermissions } from '../lib/transition-roles';
import { PartsRequestsService } from '../service/parts-requests.service';

@ApiTags('maintenance-parts')
@ApiBearerAuth()
@Controller('maintenance')
export class PartsRequestsController {
  constructor(private readonly parts: PartsRequestsService) {}

  @Get('parts-requests')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_PARTS,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  listOpen() {
    return this.parts.listOpen();
  }

  @Get('work-orders/:id/parts-requests')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_READ)
  listForWorkOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.parts.listForWorkOrder(id);
  }

  @Post('work-orders/:id/parts-requests')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_EXECUTE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePartsRequestDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.parts.create(
      id,
      dto,
      user.id,
      rolesFromPermissions(user.permissions),
    );
  }

  @Patch('parts-requests/:id')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_PARTS,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePartsRequestDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.parts.updateStatus(
      id,
      dto,
      user.id,
      rolesFromPermissions(user.permissions),
    );
  }
}
