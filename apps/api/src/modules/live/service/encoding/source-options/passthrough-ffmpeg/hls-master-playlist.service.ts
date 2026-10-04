import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { buildCustomHlsMaster } from './hls-master-build';
import { HlsMasterProbeService } from './hls-master-probe.service';
import type { HlsVariantInfo } from './hls-master-parse';

const RELATIVE_DIR = 'live-hls-masters';

export type BuiltHlsMaster = {
  /** مسار نسبي للعرض/التخزين */
  relativeUrl: string;
  /** رابط يصل إليه Mist على نفس الجهاز */
  mistUrl: string;
  variantCount: number;
};

/** توليد ملف master m3u8 من مستويات HLS مختارة */
@Injectable()
export class HlsMasterPlaylistService {
  private readonly logger = new Logger(HlsMasterPlaylistService.name);

  constructor(private readonly probe: HlsMasterProbeService) {}

  /**
   * يحلّل المصدر الأصلي، يصفّي المستويات المختارة، ويكتب master محلي.
   */
  async buildFromSelection(input: {
    channelName: string;
    masterUrl: string;
    selectedUrls: string[];
  }): Promise<BuiltHlsMaster> {
    const selected = [
      ...new Set(input.selectedUrls.map((u) => u.trim()).filter(Boolean)),
    ];
    if (selected.length < 1) {
      throw new BadRequestException('اختر مستوى جودة واحداً على الأقل');
    }

    const probed = await this.probe.probe(input.masterUrl);
    const byUrl = new Map(probed.variants.map((v) => [v.url, v]));
    const chosen: HlsVariantInfo[] = [];

    for (const url of selected) {
      const hit = byUrl.get(url);
      if (hit) {
        chosen.push(hit);
        continue;
      }
      // مستوى مُرسل مباشرة (جودة واحدة)
      chosen.push({
        url,
        bandwidth: null,
        averageBandwidth: null,
        resolution: null,
        frameRate: null,
        name: null,
        label: url,
      });
    }

    if (chosen.length === 1) {
      const only = chosen[0]!;
      return {
        relativeUrl: only.url,
        mistUrl: only.url,
        variantCount: 1,
      };
    }

    const body = buildCustomHlsMaster(chosen);
    const dir = this.ensureDir();
    const safeName = input.channelName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .slice(0, 48);
    const hash = createHash('sha1')
      .update(selected.slice().sort().join('|'))
      .digest('hex')
      .slice(0, 10);
    const filename = `${safeName || 'channel'}-${hash}.m3u8`;
    const absPath = join(dir, filename);
    writeFileSync(absPath, body, 'utf8');

    const relativeUrl = `/api/uploads/${RELATIVE_DIR}/${filename}`;
    const mistUrl = `${this.mistApiBase()}${relativeUrl}`;
    this.logger.log(
      `HLS master مخصص: ${filename} (${chosen.length} مستويات) → ${mistUrl}`,
    );

    return { relativeUrl, mistUrl, variantCount: chosen.length };
  }

  private ensureDir() {
    const dir = join(process.cwd(), 'uploads', RELATIVE_DIR);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  /** قاعدة يصل إليها MistServer محلياً لجلب الملف المولَّد */
  private mistApiBase() {
    const internal = process.env.API_INTERNAL_URL?.trim().replace(/\/$/, '');
    if (internal) return internal;
    const port = process.env.API_PORT?.trim() || '3001';
    return `http://127.0.0.1:${port}`;
  }
}
