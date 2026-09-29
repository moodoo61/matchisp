import { BadRequestException, Injectable } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export const LOGIN_ADS_UPLOAD_DIR = join(
  process.cwd(),
  'uploads',
  'login-ads',
);

function ensureUploadDir() {
  if (!existsSync(LOGIN_ADS_UPLOAD_DIR)) {
    mkdirSync(LOGIN_ADS_UPLOAD_DIR, { recursive: true });
  }
}

ensureUploadDir();

/** خيارات multer لرفع إعلانات صور تسجيل الدخول */
export const loginAdsMulterOptions: MulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      ensureUploadDir();
      cb(null, LOGIN_ADS_UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const fromMime = EXT_BY_MIME[file.mimetype];
      const fromName = extname(file.originalname).toLowerCase();
      const ext = fromMime || fromName || '.bin';
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(
        new BadRequestException(
          'يُسمح فقط بصور JPEG أو PNG أو WebP أو GIF',
        ) as unknown as Error,
        false,
      );
      return;
    }
    cb(null, true);
  },
};

@Injectable()
export class LoginImageUploadService {
  toPublicUrl(filename: string) {
    return `/api/uploads/login-ads/${filename}`;
  }
}
