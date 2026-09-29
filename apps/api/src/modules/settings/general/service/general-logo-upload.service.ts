import { BadRequestException, Injectable } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { diskStorage } from 'multer';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

export const GENERAL_LOGO_UPLOAD_DIR = join(
  process.cwd(),
  'uploads',
  'general-logo',
);

function ensureUploadDir() {
  if (!existsSync(GENERAL_LOGO_UPLOAD_DIR)) {
    mkdirSync(GENERAL_LOGO_UPLOAD_DIR, { recursive: true });
  }
}

ensureUploadDir();

export const generalLogoMulterOptions: MulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      ensureUploadDir();
      cb(null, GENERAL_LOGO_UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const fromMime = EXT_BY_MIME[file.mimetype];
      const fromName = extname(file.originalname).toLowerCase();
      const ext = fromMime || fromName || '.bin';
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(
        new BadRequestException(
          'يُسمح فقط بصور JPEG أو PNG أو WebP أو GIF أو SVG',
        ) as unknown as Error,
        false,
      );
      return;
    }
    cb(null, true);
  },
};

@Injectable()
export class GeneralLogoUploadService {
  toPublicUrl(filename: string) {
    return `/api/uploads/general-logo/${filename}`;
  }
}
