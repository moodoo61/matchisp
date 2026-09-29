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
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../../common/guards';
import { UpdateGeneralSettingsDto } from '../dto/update-general-settings.dto';
import {
  GeneralLogoUploadService,
  generalLogoMulterOptions,
} from '../service/general-logo-upload.service';
import { GeneralSettingsService } from '../service/general-settings.service';

@ApiTags('settings-general')
@ApiBearerAuth()
@Controller('settings/general')
export class GeneralSettingsController {
  constructor(
    private readonly settings: GeneralSettingsService,
    private readonly uploads: GeneralLogoUploadService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SETTINGS_GENERAL_READ)
  get() {
    return this.settings.get();
  }

  @Patch()
  @RequirePermissions(PERMISSIONS.SETTINGS_GENERAL_MANAGE)
  update(
    @Body() dto: UpdateGeneralSettingsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.settings.update(dto, user.id);
  }

  @Post('logo/upload')
  @RequirePermissions(PERMISSIONS.SETTINGS_GENERAL_MANAGE)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', generalLogoMulterOptions))
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    if (!file?.filename) {
      throw new BadRequestException('الملف مطلوب');
    }
    const logoUrl = this.uploads.toPublicUrl(file.filename);
    return this.settings.update({ logoUrl }, user.id);
  }

  @Post('brand-logo/upload')
  @RequirePermissions(PERMISSIONS.SETTINGS_GENERAL_MANAGE)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', generalLogoMulterOptions))
  async uploadBrandLogo(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    if (!file?.filename) {
      throw new BadRequestException('الملف مطلوب');
    }
    const brandLogoUrl = this.uploads.toPublicUrl(file.filename);
    return this.settings.update({ brandLogoUrl }, user.id);
  }
}
