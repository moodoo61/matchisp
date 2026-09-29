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
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './roles.dto';
import { CurrentUser, RequirePermissions, type RequestUser } from '../../common/guards';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get('permissions')
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  permissions() {
    return this.roles.listPermissions();
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  list() {
    return this.roles.listRoles();
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  create(@Body() dto: CreateRoleDto, @CurrentUser() user: RequestUser) {
    return this.roles.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.roles.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.roles.remove(id, user.id);
  }
}
