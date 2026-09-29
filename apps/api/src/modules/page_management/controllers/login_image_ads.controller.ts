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
import { LoginImageAdsService } from '../service/login_image_ads.service';
import {
  LoginImageUploadService,
  loginAdsMulterOptions,
} from '../service/login_image_upload.service';
import { CreateImageAdDto } from '../dto/create-image-ad.dto';
import { UpdateImageAdDto } from '../dto/update-image-ad.dto';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';

@ApiTags('page-management-login-image-ads')
@ApiBearerAuth()
@Controller('pages/login/images')
export class LoginImageAdsController {
  constructor(
    private readonly imageAds: LoginImageAdsService,
    private readonly uploads: LoginImageUploadService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_IMAGES_READ)
  list() {
    return this.imageAds.listAdmin();
  }

  @Post('upload')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_IMAGES_MANAGE)
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
  @UseInterceptors(FileInterceptor('file', loginAdsMulterOptions))
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('لم يتم اختيار ملف');
    }
    return { imageUrl: this.uploads.toPublicUrl(file.filename) };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_IMAGES_READ)
  get(@Param('id') id: string) {
    return this.imageAds.get(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_IMAGES_MANAGE)
  create(@Body() dto: CreateImageAdDto, @CurrentUser() user: RequestUser) {
    return this.imageAds.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_IMAGES_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateImageAdDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.imageAds.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_IMAGES_MANAGE)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.imageAds.remove(id, user.id);
  }
}
