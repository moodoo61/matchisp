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
import { LoginPackagesService } from '../service/login_packages.service';
import { CreateLoginPackageDto } from '../dto/create-login-package.dto';
import { UpdateLoginPackageDto } from '../dto/update-login-package.dto';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';

@ApiTags('page-management-login-packages')
@ApiBearerAuth()
@Controller('pages/login/packages')
export class LoginPackagesController {
  constructor(private readonly packages: LoginPackagesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_PACKAGES_READ)
  list() {
    return this.packages.listAdmin();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_PACKAGES_READ)
  get(@Param('id') id: string) {
    return this.packages.get(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_PACKAGES_CREATE)
  create(
    @Body() dto: CreateLoginPackageDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.packages.create(dto, user.id);
  }

  @Patch(':id')
  @RequireAnyPermission(
    PERMISSIONS.PAGE_LOGIN_PACKAGES_UPDATE,
    PERMISSIONS.PAGE_LOGIN_PACKAGES_TOGGLE,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLoginPackageDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.packages.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_PACKAGES_DELETE)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.packages.remove(id, user.id);
  }
}
