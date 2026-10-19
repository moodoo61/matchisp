import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { LoginExternalAuthService } from '../service/login_external_auth.service';
import { UpdateLoginExternalAuthDto } from '../dto/update-login-external-auth.dto';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';

@ApiTags('page-management-login-external-auth')
@ApiBearerAuth()
@Controller('pages/login/external-auth')
export class LoginExternalAuthController {
  constructor(private readonly externalAuth: LoginExternalAuthService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_EXTERNAL_AUTH_READ)
  get() {
    return this.externalAuth.get();
  }

  @Patch()
  @RequireAnyPermission(
    PERMISSIONS.PAGE_LOGIN_EXTERNAL_AUTH_UPDATE,
    PERMISSIONS.PAGE_LOGIN_EXTERNAL_AUTH_MANAGE,
  )
  update(
    @Body() dto: UpdateLoginExternalAuthDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.externalAuth.update(dto, user.id);
  }
}
