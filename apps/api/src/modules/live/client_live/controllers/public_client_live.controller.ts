import { Controller, Get, Param, Post } from '@nestjs/common';
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

  /**
   * إيقاظ ستريم Mist عبر طلب رابط التشغيل الحقيقي،
   * ثم إعادة حالة online/جودات (بدون تبديل مشغّل).
   */
  @Public()
  @Post('channels/:id/wake')
  wakeChannel(@Param('id') id: string) {
    return this.clientLive.wakeChannel(id);
  }

  /** جاهزية قناة — online / جودات TS / روابط (استطلاع بعد الإيقاظ) */
  @Public()
  @Get('channels/:id/playback-ready')
  getChannelPlaybackReady(@Param('id') id: string) {
    return this.clientLive.getChannelPlaybackReady(id);
  }

  @Public()
  @Get('sections')
  listSections() {
    return this.clientLive.listGrouped();
  }
}
