import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { LoginBrandService } from '../service/login_brand.service';
import {
  LoginBrandUploadService,
  loginBrandMulterOptions,
} from '../service/login_brand_upload.service';
import { UpdateLoginBrandDto } from '../dto/update-login-brand.dto';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';

@ApiTags('page-management-login-brand')
@ApiBearerAuth()
@Controller('pages/login/brand')
export class LoginBrandController {
  constructor(
    private readonly brand: LoginBrandService,
    private readonly uploads: LoginBrandUploadService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_BRAND_READ)
  get() {
    return this.brand.get();
  }

  @Post('upload')
  @RequireAnyPermission(
    PERMISSIONS.PAGE_LOGIN_BRAND_UPDATE,
    PERMISSIONS.PAGE_LOGIN_BRAND_MANAGE,
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
  @UseInterceptors(FileInterceptor('file', loginBrandMulterOptions))
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('لم يتم اختيار ملف');
    return { logoUrl: this.uploads.toPublicUrl(file.filename) };
  }

  @Patch()
  @RequireAnyPermission(
    PERMISSIONS.PAGE_LOGIN_BRAND_UPDATE,
    PERMISSIONS.PAGE_LOGIN_BRAND_MANAGE,
  )
  update(
    @Body() dto: UpdateLoginBrandDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.brand.update(dto, user.id);
  }
}
