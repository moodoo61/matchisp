import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildMistPlaybackUrls,
  normalizeMistHttpBase,
  type MistPlaybackUrls,
} from './mist-playback-urls';

/**
 * روابط مشاهدة القنوات من MistServer.
 * الافتراضي: مسارات نسبية — المشغّل يبني المضيف من عنوان صفحة المشاهدة.
 * اختياري: MISTSERVER_HTTP_URL صريح إن كان Mist على مضيف آخر.
 */
@Injectable()
export class MistPlaybackService {
  constructor(private readonly config: ConfigService) {}

  /** قاعدة صريحة إن وُجدت؛ فارغ = نفس مضيف صفحة المشغّل */
  httpBase(): string {
    return normalizeMistHttpBase(this.config.get<string>('MISTSERVER_HTTP_URL'));
  }

  urlsFor(streamName: string): MistPlaybackUrls {
    return buildMistPlaybackUrls(this.httpBase(), streamName);
  }
}
