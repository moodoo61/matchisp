import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MorePagePublicService } from '../service/more_page_public.service';
import { Public } from '../../../common/guards';

/** نقطة نهاية عامة لصفحة المزيد */
@ApiTags('public-more')
@Controller('public/more')
export class PublicMoreContentController {
  constructor(private readonly more: MorePagePublicService) {}

  @Public()
  @Get()
  get() {
    return this.more.getPublic();
  }
}
