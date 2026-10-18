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
import { MorePageAboutService } from '../service/more_page_about.service';
import { CreateMorePageAboutDto } from '../dto/create-more-page-about.dto';
import { UpdateMorePageAboutDto } from '../dto/update-more-page-about.dto';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';

@ApiTags('page-management-more-about')
@ApiBearerAuth()
@Controller('pages/more/about')
export class MorePageAboutController {
  constructor(private readonly about: MorePageAboutService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PAGE_MORE_ABOUT_READ)
  list() {
    return this.about.listAdmin();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PAGE_MORE_ABOUT_READ)
  get(@Param('id') id: string) {
    return this.about.get(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PAGE_MORE_ABOUT_CREATE)
  create(
    @Body() dto: CreateMorePageAboutDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.about.create(dto, user.id);
  }

  @Patch(':id')
  @RequireAnyPermission(
    PERMISSIONS.PAGE_MORE_ABOUT_UPDATE,
    PERMISSIONS.PAGE_MORE_ABOUT_TOGGLE,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMorePageAboutDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.about.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PAGE_MORE_ABOUT_DELETE)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.about.remove(id, user.id);
  }
}
