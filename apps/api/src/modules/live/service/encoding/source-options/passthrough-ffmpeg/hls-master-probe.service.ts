import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  parseHlsMasterPlaylist,
  type HlsProbeResult,
} from './hls-master-parse';

const MAX_BYTES = 512 * 1024;
const TIMEOUT_MS = 12_000;

/** جلب وتحليل master playlist لخيار مباشر ffmpeg */
@Injectable()
export class HlsMasterProbeService {
  private readonly logger = new Logger(HlsMasterProbeService.name);

  async probe(rawUrl: string): Promise<HlsProbeResult> {
    const masterUrl = this.normalizeHttpUrl(rawUrl);
    const body = await this.fetchText(masterUrl);
    if (!body.includes('#EXTM3U') && !body.includes('#EXT')) {
      throw new BadRequestException(
        'المحتوى ليس قائمة HLS صالحة (m3u8)',
      );
    }
    const result = parseHlsMasterPlaylist(masterUrl, body);
    this.logger.log(
      `HLS probe ${masterUrl}: isMaster=${result.isMaster} variants=${result.variants.length}`,
    );
    return result;
  }

  private normalizeHttpUrl(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new BadRequestException('رابط المصدر مطلوب');
    }
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      throw new BadRequestException('رابط المصدر غير صالح');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new BadRequestException('يُسمح بروابط http/https فقط');
    }
    return url.href;
  }

  private async fetchText(url: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          Accept: 'application/vnd.apple.mpegurl, application/x-mpegURL, */*',
          'User-Agent': 'ISP-Admin-HLS-Probe/1.0',
        },
      });
      if (!res.ok) {
        throw new BadRequestException(
          `تعذر جلب القائمة (HTTP ${res.status})`,
        );
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength > MAX_BYTES) {
        throw new BadRequestException('ملف القائمة أكبر من الحد المسموح');
      }
      return buf.toString('utf8');
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new BadRequestException('انتهت مهلة جلب قائمة الجودة');
      }
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.warn(`HLS probe failed ${url}: ${detail}`);
      throw new BadRequestException(`تعذر تحليل الرابط: ${detail}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
