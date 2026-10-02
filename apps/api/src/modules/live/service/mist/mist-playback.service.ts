import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildMistPlaybackUrls,
  isLoopbackHttpBase,
  resolveMistPublicHttpBase,
  type MistPlaybackUrls,
} from './mist-playback-urls';

export type MistPlaybackResolveOptions = {
  /** Origin/Host من طلب المتصفح */
  requestOrigin?: string | null;
  /**
   * true لواجهات المشاهدة العامة/الإدارية:
   * يفضّل مضيف الطلب على MISTSERVER_HTTP_URL الثابت.
   */
  preferRequest?: boolean;
};

/** روابط مشاهدة القنوات من منفذ HTTP لـ MistServer (ليس api2) */
@Injectable()
export class MistPlaybackService {
  private readonly logger = new Logger(MistPlaybackService.name);
  private warnedLoopback = false;

  constructor(private readonly config: ConfigService) {}

  /** قاعدة يصل إليها متصفح العميل (IP/نطاق الجهاز الذي فُتح منه الطلب) */
  httpBase(options: MistPlaybackResolveOptions = {}) {
    const base = resolveMistPublicHttpBase({
      configured: this.config.get<string>('MISTSERVER_HTTP_URL'),
      adminWebUrl: this.config.get<string>('ADMIN_WEB_URL'),
      requestOrigin: options.requestOrigin,
      preferRequest: options.preferRequest,
    });

    if (isLoopbackHttpBase(base) && !this.warnedLoopback) {
      this.warnedLoopback = true;
      this.logger.warn(
        'عنوان مشاهدة Mist يشير إلى localhost — متصفح العميل لن يصل للبث. عيّن MISTSERVER_HTTP_URL أو افتح الواجهة عبر IP/نطاق الجهاز',
      );
    }

    return base;
  }

  urlsFor(
    streamName: string,
    options: MistPlaybackResolveOptions = {},
  ): MistPlaybackUrls {
    return buildMistPlaybackUrls(this.httpBase(options), streamName);
  }
}
