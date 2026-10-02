import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../../../common/guards';
import { requestOriginFromHeaders } from '../../service/mist/mist-playback-urls';
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
  listChannels(@Req() req: Request) {
    return this.clientLive.listChannels(requestOriginFromHeaders(req.headers));
  }

  @Public()
  @Get('sections')
  listSections(@Req() req: Request) {
    return this.clientLive.listGrouped(requestOriginFromHeaders(req.headers));
  }
}
