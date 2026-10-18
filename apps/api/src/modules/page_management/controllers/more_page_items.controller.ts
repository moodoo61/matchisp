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
import { MorePageItemsService } from '../service/more_page_items.service';
import {
  MorePageUploadService,
  morePageMulterOptions,
} from '../service/more_page_upload.service';
import { CreateMorePageItemDto } from '../dto/create-more-page-item.dto';
import { UpdateMorePageItemDto } from '../dto/update-more-page-item.dto';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';

@ApiTags('page-management-more-items')
@ApiBearerAuth()
@Controller('pages/more/items')
export class MorePageItemsController {
  constructor(
    private readonly items: MorePageItemsService,
    private readonly uploads: MorePageUploadService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PAGE_MORE_ITEMS_READ)
  list() {
    return this.items.listAdmin();
  }

  @Post('upload')
  @RequireAnyPermission(
    PERMISSIONS.PAGE_MORE_ITEMS_CREATE,
    PERMISSIONS.PAGE_MORE_ITEMS_UPDATE,
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
  @UseInterceptors(FileInterceptor('file', morePageMulterOptions))
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('لم يتم اختيار ملف');
    }
    return { imageUrl: this.uploads.toPublicUrl(file.filename) };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PAGE_MORE_ITEMS_READ)
  get(@Param('id') id: string) {
    return this.items.get(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PAGE_MORE_ITEMS_CREATE)
  create(
    @Body() dto: CreateMorePageItemDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.items.create(dto, user.id);
  }

  @Patch(':id')
  @RequireAnyPermission(
    PERMISSIONS.PAGE_MORE_ITEMS_UPDATE,
    PERMISSIONS.PAGE_MORE_ITEMS_TOGGLE,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMorePageItemDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.items.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PAGE_MORE_ITEMS_DELETE)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.items.remove(id, user.id);
  }
}
