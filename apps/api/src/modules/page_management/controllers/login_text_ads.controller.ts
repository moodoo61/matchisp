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
import { LoginTextAdsService } from '../service/login_text_ads.service';
import { CreateTextAdDto } from '../dto/create-text-ad.dto';
import { UpdateTextAdDto } from '../dto/update-text-ad.dto';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';

@ApiTags('page-management-login-text-ads')
@ApiBearerAuth()
@Controller('pages/login/text')
export class LoginTextAdsController {
  constructor(private readonly textAds: LoginTextAdsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_TICKER_READ)
  list() {
    return this.textAds.listAdmin();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_TICKER_READ)
  get(@Param('id') id: string) {
    return this.textAds.get(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_TICKER_CREATE)
  create(@Body() dto: CreateTextAdDto, @CurrentUser() user: RequestUser) {
    return this.textAds.create(dto, user.id);
  }

  @Patch(':id')
  @RequireAnyPermission(
    PERMISSIONS.PAGE_LOGIN_TICKER_UPDATE,
    PERMISSIONS.PAGE_LOGIN_TICKER_TOGGLE,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTextAdDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.textAds.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_TICKER_DELETE)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.textAds.remove(id, user.id);
  }
}
