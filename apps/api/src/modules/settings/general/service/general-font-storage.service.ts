import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  findUiFont,
  GENERAL_UI_FONTS,
  resolveUiFontId,
  type GeneralUiFontDef,
} from '../constants/general-fonts';

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const GENERAL_FONTS_UPLOAD_DIR = join(
  process.cwd(),
  'uploads',
  'general-fonts',
);

type FontManifest = {
  id: string;
  family: string;
  weights: Array<{ weight: number; file: string }>;
};

export type UiFontFace = {
  weight: number;
  url: string;
};

@Injectable()
export class GeneralFontStorageService {
  private readonly logger = new Logger(GeneralFontStorageService.name);

  constructor() {
    if (!existsSync(GENERAL_FONTS_UPLOAD_DIR)) {
      mkdirSync(GENERAL_FONTS_UPLOAD_DIR, { recursive: true });
    }
  }

  listCatalog() {
    return GENERAL_UI_FONTS.map((font) => ({
      id: font.id,
      family: font.family,
      label: font.label,
      weights: [...font.weights],
      localReady: this.isLocalReady(font.id),
    }));
  }

  isLocalReady(fontId: string): boolean {
    const font = findUiFont(fontId);
    if (!font) return false;
    const manifest = this.readManifest(font.id);
    if (!manifest) return false;
    return font.weights.every((w) => {
      const entry = manifest.weights.find((m) => m.weight === w);
      return entry ? existsSync(this.filePath(font.id, entry.file)) : false;
    });
  }

  getFaces(fontId: string): UiFontFace[] {
    const id = resolveUiFontId(fontId);
    const manifest = this.readManifest(id);
    if (!manifest) return [];
    return manifest.weights
      .filter((w) => existsSync(this.filePath(id, w.file)))
      .map((w) => ({
        weight: w.weight,
        url: this.toPublicUrl(id, w.file),
      }));
  }

  async ensureLocal(fontId: string): Promise<{
    id: string;
    family: string;
    localReady: boolean;
    faces: UiFontFace[];
  }> {
    const font = findUiFont(fontId);
    if (!font) {
      throw new BadRequestException('خط غير مدعوم');
    }
    if (!this.isLocalReady(font.id)) {
      await this.downloadFont(font);
    }
    return {
      id: font.id,
      family: font.family,
      localReady: this.isLocalReady(font.id),
      faces: this.getFaces(font.id),
    };
  }

  private async downloadFont(font: GeneralUiFontDef) {
    const dir = join(GENERAL_FONTS_UPLOAD_DIR, font.id);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const cssUrl = `https://fonts.googleapis.com/css2?family=${font.googleFamily}:wght@${font.weights.join(';')}&display=swap`;
    let css: string;
    try {
      const res = await fetch(cssUrl, {
        headers: { 'User-Agent': CHROME_UA, Accept: 'text/css,*/*' },
      });
      if (!res.ok) {
        throw new Error(`CSS HTTP ${res.status}`);
      }
      css = await res.text();
    } catch (err) {
      this.logger.error(`تعذر جلب CSS للخط ${font.id}`, err);
      throw new ServiceUnavailableException(
        'تعذر تنزيل الخط من الإنترنت — تحقق من اتصال الخادم ثم أعد المحاولة',
      );
    }

    const faces = this.parseFontFaces(css);
    if (!faces.length) {
      throw new ServiceUnavailableException(
        'تعذر استخراج ملفات الخط من مصدر التنزيل',
      );
    }

    const weights: FontManifest['weights'] = [];
    for (const face of faces) {
      const file = `${face.weight}.woff2`;
      try {
        const bin = await fetch(face.srcUrl, {
          headers: { 'User-Agent': CHROME_UA },
        });
        if (!bin.ok) {
          throw new Error(`font HTTP ${bin.status}`);
        }
        const buf = Buffer.from(await bin.arrayBuffer());
        writeFileSync(this.filePath(font.id, file), buf);
        weights.push({ weight: face.weight, file });
      } catch (err) {
        this.logger.error(`تعذر تنزيل وزن ${face.weight} للخط ${font.id}`, err);
        throw new ServiceUnavailableException(
          `تعذر تنزيل ملف الخط (وزن ${face.weight})`,
        );
      }
    }

    const missing = font.weights.filter(
      (w) => !weights.some((entry) => entry.weight === w),
    );
    if (missing.length) {
      throw new ServiceUnavailableException(
        `لم تُكتمل أوزان الخط: ${missing.join(', ')}`,
      );
    }

    const manifest: FontManifest = {
      id: font.id,
      family: font.family,
      weights: weights.sort((a, b) => a.weight - b.weight),
    };
    writeFileSync(
      this.manifestPath(font.id),
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf8',
    );
  }

  private parseFontFaces(
    css: string,
  ): Array<{ weight: number; srcUrl: string }> {
    const blocks = css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g);
    const out: Array<{ weight: number; srcUrl: string }> = [];
    for (const match of blocks) {
      const body = match[1] ?? '';
      const weightMatch = body.match(/font-weight\s*:\s*(\d+)/i);
      const urlMatch = body.match(
        /src\s*:[^;]*url\((['"]?)(https?:\/\/[^)'"]+)\1\)/i,
      );
      if (!weightMatch || !urlMatch?.[2]) continue;
      const weight = Number(weightMatch[1]);
      if (!Number.isFinite(weight)) continue;
      out.push({ weight, srcUrl: urlMatch[2] });
    }
    // أول ظهور لكل وزن (woff2 عادةً)
    const byWeight = new Map<number, string>();
    for (const face of out) {
      if (!byWeight.has(face.weight)) {
        byWeight.set(face.weight, face.srcUrl);
      }
    }
    return [...byWeight.entries()].map(([weight, srcUrl]) => ({
      weight,
      srcUrl,
    }));
  }

  private readManifest(fontId: string): FontManifest | null {
    const path = this.manifestPath(fontId);
    if (!existsSync(path)) return null;
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as FontManifest;
    } catch {
      return null;
    }
  }

  private manifestPath(fontId: string) {
    return join(GENERAL_FONTS_UPLOAD_DIR, fontId, 'manifest.json');
  }

  private filePath(fontId: string, file: string) {
    return join(GENERAL_FONTS_UPLOAD_DIR, fontId, file);
  }

  private toPublicUrl(fontId: string, file: string) {
    return `/api/uploads/general-fonts/${fontId}/${file}`;
  }
}
