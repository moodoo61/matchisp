import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildMistPlaybackUrls,
  normalizeMistHttpBase,
  type MistPlaybackUrls,
} from './mist-playback-urls';
import { MistJwtService } from './mist-jwt.service';

/**
 * روابط مشاهدة القنوات من MistServer.
 * الافتراضي: مسارات نسبية — المشغّل يبني المضيف من عنوان صفحة المشاهدة.
 * اختياري: MISTSERVER_HTTP_URL صريح إن كان Mist على مضيف آخر.
 * اختياري: توقيع JWT (tkn) عند تفعيل حماية صفحة المشاهدة.
 */
@Injectable()
export class MistPlaybackService {
  constructor(
    private readonly config: ConfigService,
    private readonly mistJwt: MistJwtService,
  ) {}

  /** قاعدة صريحة إن وُجدت؛ فارغ = نفس مضيف صفحة المشغّل */
  httpBase(): string {
    return normalizeMistHttpBase(this.config.get<string>('MISTSERVER_HTTP_URL'));
  }

  urlsFor(
    streamName: string,
    options?: { signed?: boolean },
  ): MistPlaybackUrls {
    const token = options?.signed
      ? this.mistJwt.signViewerToken(streamName)
      : null;
    return buildMistPlaybackUrls(this.httpBase(), streamName, token);
  }
}
