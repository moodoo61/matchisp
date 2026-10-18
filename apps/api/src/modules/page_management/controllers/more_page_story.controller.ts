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
import { MorePageStoryService } from '../service/more_page_story.service';
import {
  MorePageUploadService,
  morePageMulterOptions,
} from '../service/more_page_upload.service';
import { CreateMorePageStoryDto } from '../dto/create-more-page-story.dto';
import { UpdateMorePageStoryDto } from '../dto/update-more-page-story.dto';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';

@ApiTags('page-management-more-story')
@ApiBearerAuth()
@Controller('pages/more/story')
export class MorePageStoryController {
  constructor(
    private readonly story: MorePageStoryService,
    private readonly uploads: MorePageUploadService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PAGE_MORE_STORY_READ)
  list() {
    return this.story.listAdmin();
  }

  @Post('upload')
  @RequireAnyPermission(
    PERMISSIONS.PAGE_MORE_STORY_CREATE,
    PERMISSIONS.PAGE_MORE_STORY_UPDATE,
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
  @RequirePermissions(PERMISSIONS.PAGE_MORE_STORY_READ)
  get(@Param('id') id: string) {
    return this.story.get(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PAGE_MORE_STORY_CREATE)
  create(
    @Body() dto: CreateMorePageStoryDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.story.create(dto, user.id);
  }

  @Patch(':id')
  @RequireAnyPermission(
    PERMISSIONS.PAGE_MORE_STORY_UPDATE,
    PERMISSIONS.PAGE_MORE_STORY_TOGGLE,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMorePageStoryDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.story.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PAGE_MORE_STORY_DELETE)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.story.remove(id, user.id);
  }
}
