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
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_PACKAGES_MANAGE)
  create(
    @Body() dto: CreateLoginPackageDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.packages.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_PACKAGES_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLoginPackageDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.packages.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_PACKAGES_MANAGE)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.packages.remove(id, user.id);
  }
}
