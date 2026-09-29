import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  PAGE_CARD_FLAG_MANAGE_PERMISSION,
  PERMISSIONS,
  hasPermission,
} from '@isp/shared';
import { PageCardFlagsService } from '../service/page_card_flags.service';
import { UpdatePageCardFlagDto } from '../dto/update-page-card-flag.dto';
import {
  CurrentUser,
  RequireAnyPermission,
  type RequestUser,
} from '../../../common/guards';

const ANY_PAGE_READ = [
  PERMISSIONS.PAGE_MANAGEMENT_READ,
  PERMISSIONS.PAGE_LOGIN_IMAGES_READ,
  PERMISSIONS.PAGE_LOGIN_TICKER_READ,
  PERMISSIONS.PAGE_LOGIN_SERVICES_READ,
  PERMISSIONS.PAGE_LOGIN_CONTACTS_READ,
  PERMISSIONS.PAGE_LOGIN_PACKAGES_READ,
  PERMISSIONS.PAGE_STATUS_SERVICES_READ,
  PERMISSIONS.PAGE_SPEED_READ,
  PERMISSIONS.PAGE_LOGIN_IMAGES_MANAGE,
  PERMISSIONS.PAGE_LOGIN_TICKER_MANAGE,
  PERMISSIONS.PAGE_LOGIN_SERVICES_MANAGE,
  PERMISSIONS.PAGE_LOGIN_CONTACTS_MANAGE,
  PERMISSIONS.PAGE_LOGIN_PACKAGES_MANAGE,
  PERMISSIONS.PAGE_STATUS_SERVICES_MANAGE,
  PERMISSIONS.PAGE_SPEED_MANAGE,
] as const;

@ApiTags('page-management-card-flags')
@ApiBearerAuth()
@Controller('pages/card-flags')
export class PageCardFlagsController {
  constructor(private readonly flags: PageCardFlagsService) {}

  @Get()
  @RequireAnyPermission(...ANY_PAGE_READ)
  list() {
    return this.flags.list();
  }

  @Get(':key')
  @RequireAnyPermission(...ANY_PAGE_READ)
  get(@Param('key') key: string) {
    return this.flags.get(key);
  }

  @Patch(':key')
  update(
    @Param('key') key: string,
    @Body() dto: UpdatePageCardFlagDto,
    @CurrentUser() user: RequestUser,
  ) {
    const required = PAGE_CARD_FLAG_MANAGE_PERMISSION[key];
    if (!required || !hasPermission(user.permissions, required)) {
      throw new ForbiddenException('لا تملك صلاحية تعديل هذه البطاقة');
    }
    return this.flags.update(key, dto, user.id);
  }
}
