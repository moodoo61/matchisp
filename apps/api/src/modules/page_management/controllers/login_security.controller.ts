import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { LoginSecurityService } from '../service/login_security.service';
import { UpdateLoginSecurityDto } from '../dto/update-login-security.dto';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';

@ApiTags('page-management-login-security')
@ApiBearerAuth()
@Controller('pages/login/security')
export class LoginSecurityController {
  constructor(private readonly security: LoginSecurityService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_SECURITY_READ)
  get() {
    return this.security.get();
  }

  @Patch()
  @RequireAnyPermission(
    PERMISSIONS.PAGE_LOGIN_SECURITY_UPDATE,
    PERMISSIONS.PAGE_LOGIN_SECURITY_MANAGE,
  )
  update(
    @Body() dto: UpdateLoginSecurityDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.security.update(dto, user.id);
  }
}
