import {
  Body,
  Controller,
  Delete,
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
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';
import { CreateExtensionDto } from '../dto/create-extension.dto';
import { UpdateExtensionDto } from '../dto/update-extension.dto';
import { ExtensionsService } from '../service/extensions.service';

@ApiTags('comms-extensions')
@ApiBearerAuth()
@Controller('comms/extensions')
export class ExtensionsController {
  constructor(private readonly extensions: ExtensionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.COMMS_READ)
  list() {
    return this.extensions.list();
  }

  @Post()
  @RequirePermissions(PERMISSIONS.COMMS_CREATE)
  create(@Body() dto: CreateExtensionDto, @CurrentUser() user: RequestUser) {
    return this.extensions.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.COMMS_UPDATE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExtensionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.extensions.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.COMMS_DELETE)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.extensions.remove(id, user.id);
  }
}
