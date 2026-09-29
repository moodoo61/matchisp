import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  findSectionDatabase,
  SECTION_DATABASES,
  type SectionDatabaseDef,
} from '../constants/section-databases';

export type ParsedDbUrl = {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
};

@Injectable()
export class DatabasesCatalogService {
  constructor(private readonly config: ConfigService) {}

  listDefs(): readonly SectionDatabaseDef[] {
    return SECTION_DATABASES;
  }

  requireDef(key: string): SectionDatabaseDef {
    const def = findSectionDatabase(key);
    if (!def) throw new BadRequestException('قسم قاعدة البيانات غير معروف');
    return def;
  }

  parseUrl(def: SectionDatabaseDef): ParsedDbUrl {
    const raw = this.config.get<string>(def.envKey)?.trim();
    if (!raw) {
      throw new BadRequestException(
        `متغير البيئة ${def.envKey} غير مضبوط`,
      );
    }
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      throw new BadRequestException(`رابط قاعدة غير صالح: ${def.envKey}`);
    }
    const database = url.pathname.replace(/^\//, '').split('?')[0];
    if (!database) {
      throw new BadRequestException(`اسم القاعدة مفقود في ${def.envKey}`);
    }
    return {
      host: url.hostname || 'localhost',
      port: url.port || '5432',
      user: decodeURIComponent(url.username || 'isp'),
      password: decodeURIComponent(url.password || ''),
      database,
    };
  }

  envFor(conn: ParsedDbUrl): NodeJS.ProcessEnv {
    return {
      ...process.env,
      PGPASSWORD: conn.password,
      PGHOST: conn.host,
      PGPORT: conn.port,
      PGUSER: conn.user,
    };
  }
}
