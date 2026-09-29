import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildMistPlaybackUrls,
  isLoopbackHttpBase,
  resolveMistPublicHttpBase,
  type MistPlaybackUrls,
} from './mist-playback-urls';

/** روابط مشاهدة القنوات من منفذ HTTP لـ MistServer (ليس api2) */
@Injectable()
export class MistPlaybackService {
  private readonly logger = new Logger(MistPlaybackService.name);
  private warnedLoopback = false;

  constructor(private readonly config: ConfigService) {}

  /** قاعدة يصل إليها متصفح العميل (IP/نطاق عام) */
  httpBase() {
    const base = resolveMistPublicHttpBase({
      configured: this.config.get<string>('MISTSERVER_HTTP_URL'),
      adminWebUrl: this.config.get<string>('ADMIN_WEB_URL'),
    });

    if (isLoopbackHttpBase(base) && !this.warnedLoopback) {
      this.warnedLoopback = true;
      this.logger.warn(
        'MISTSERVER_HTTP_URL يشير إلى localhost — متصفح العميل لن يصل للبث. عيّن عنواناً عاماً مثل http://IP أو http://domain',
      );
    }

    return base;
  }

  urlsFor(streamName: string): MistPlaybackUrls {
    return buildMistPlaybackUrls(this.httpBase(), streamName);
  }
}
