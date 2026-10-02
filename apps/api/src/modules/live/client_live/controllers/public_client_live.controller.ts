import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../common/guards';
import { PublicClientLiveService } from '../service/public_client_live.service';
import { ViewingPageService } from '../service/viewing_page.service';

/** نقاط نهاية عامة لواجهة البث (بدون تسجيل دخول) */
@ApiTags('public-live')
@Controller('public/live')
export class PublicClientLiveController {
  constructor(
    private readonly clientLive: PublicClientLiveService,
    private readonly viewingPage: ViewingPageService,
  ) {}

  @Public()
  @Get('settings')
  getSettings() {
    return this.viewingPage.getPublicSettings();
  }

  @Public()
  @Get('channels')
  listChannels() {
    return this.clientLive.listChannels();
  }

  @Public()
  @Get('sections')
  listSections() {
    return this.clientLive.listGrouped();
  }
}
