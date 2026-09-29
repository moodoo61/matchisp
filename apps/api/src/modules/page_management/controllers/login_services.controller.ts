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
import { LoginServicesService } from '../service/login_services.service';
import {
  LoginServiceUploadService,
  loginServicesMulterOptions,
} from '../service/login_service_upload.service';
import { CreateLoginServiceDto } from '../dto/create-login-service.dto';
import { UpdateLoginServiceDto } from '../dto/update-login-service.dto';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';

@ApiTags('page-management-login-services')
@ApiBearerAuth()
@Controller('pages/login/services')
export class LoginServicesController {
  constructor(
    private readonly services: LoginServicesService,
    private readonly uploads: LoginServiceUploadService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_SERVICES_READ)
  list() {
    return this.services.listAdmin();
  }

  @Post('upload')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_SERVICES_MANAGE)
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
  @UseInterceptors(FileInterceptor('file', loginServicesMulterOptions))
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('لم يتم اختيار ملف');
    }
    return { imageUrl: this.uploads.toPublicUrl(file.filename) };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_SERVICES_READ)
  get(@Param('id') id: string) {
    return this.services.get(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_SERVICES_MANAGE)
  create(
    @Body() dto: CreateLoginServiceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.services.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_SERVICES_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLoginServiceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.services.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_SERVICES_MANAGE)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.services.remove(id, user.id);
  }
}
