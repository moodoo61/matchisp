import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { LoginFeaturesService } from '../service/login_features.service';
import {
  LoginFeatureUploadService,
  loginFeaturesMulterOptions,
} from '../service/login_feature_upload.service';
import { CreateLoginFeatureDto } from '../dto/create-login-feature.dto';
import { UpdateLoginFeatureDto } from '../dto/update-login-feature.dto';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';

@ApiTags('page-management-login-features')
@ApiBearerAuth()
@Controller('pages/login/features')
export class LoginFeaturesController {
  constructor(
    private readonly features: LoginFeaturesService,
    private readonly uploads: LoginFeatureUploadService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_FEATURES_READ)
  list() {
    return this.features.listAdmin();
  }

  @Post('upload')
  @RequireAnyPermission(
    PERMISSIONS.PAGE_LOGIN_FEATURES_CREATE,
    PERMISSIONS.PAGE_LOGIN_FEATURES_UPDATE,
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
  @UseInterceptors(FileInterceptor('file', loginFeaturesMulterOptions))
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('لم يتم اختيار ملف');
    return { imageUrl: this.uploads.toPublicUrl(file.filename) };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_FEATURES_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.features.get(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_FEATURES_CREATE)
  create(
    @Body() dto: CreateLoginFeatureDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.features.create(dto, user.id);
  }

  @Patch(':id')
  @RequireAnyPermission(
    PERMISSIONS.PAGE_LOGIN_FEATURES_UPDATE,
    PERMISSIONS.PAGE_LOGIN_FEATURES_TOGGLE,
  )
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoginFeatureDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.features.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_FEATURES_DELETE)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.features.remove(id, user.id);
  }
}
