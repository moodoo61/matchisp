import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { StatusServicesService } from '../service/status_services.service';
import {
  StatusServiceUploadService,
  statusServicesMulterOptions,
} from '../service/status_service_upload.service';
import { CreateStatusServiceDto } from '../dto/create-status-service.dto';
import { UpdateStatusServiceDto } from '../dto/update-status-service.dto';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';

@ApiTags('page-management-status-services')
@ApiBearerAuth()
@Controller('pages/status/services')
export class StatusServicesController {
  constructor(
    private readonly services: StatusServicesService,
    private readonly uploads: StatusServiceUploadService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PAGE_STATUS_SERVICES_READ)
  list() {
    return this.services.listAdmin();
  }

  @Post('upload')
  @RequireAnyPermission(
    PERMISSIONS.PAGE_STATUS_SERVICES_CREATE,
    PERMISSIONS.PAGE_STATUS_SERVICES_UPDATE,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', statusServicesMulterOptions))
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('لم يتم اختيار ملف');
    }
    return { imageUrl: this.uploads.toPublicUrl(file.filename) };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PAGE_STATUS_SERVICES_READ)
  get(@Param('id') id: string) {
    return this.services.get(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PAGE_STATUS_SERVICES_CREATE)
  create(
    @Body() dto: CreateStatusServiceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.services.create(dto, user.id);
  }

  @Patch(':id')
  @RequireAnyPermission(
    PERMISSIONS.PAGE_STATUS_SERVICES_UPDATE,
    PERMISSIONS.PAGE_STATUS_SERVICES_TOGGLE,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStatusServiceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.services.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PAGE_STATUS_SERVICES_DELETE)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.services.remove(id, user.id);
  }
}
