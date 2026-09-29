import { Injectable } from '@nestjs/common';
import { PrismaLiveService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';
import {
  DEFAULT_VIEWING_PAGE_SETTINGS,
  VIEWING_PAGE_META_KEY,
  type ViewingPageSettings,
} from '../constants/viewing-page';
import { UpdateViewingPageDto } from '../dto/update-viewing-page.dto';

@Injectable()
export class ViewingPageService {
  constructor(
    private readonly prisma: PrismaLiveService,
    private readonly audit: AuditService,
  ) {}

  async getSettings(): Promise<ViewingPageSettings> {
    return this.loadSettings();
  }

  async getPublicSettings(): Promise<ViewingPageSettings> {
    return this.loadSettings();
  }

  async updateSettings(dto: UpdateViewingPageDto, actorId: string) {
    const current = await this.loadSettings();
    const next: ViewingPageSettings = {
      enabled: dto.enabled ?? current.enabled,
      brandTitle: normalizeText(dto.brandTitle, current.brandTitle, 80),
      pageTitle: normalizeText(dto.pageTitle, current.pageTitle, 120),
      tagline:
        dto.tagline !== undefined
          ? dto.tagline.trim().slice(0, 200)
          : current.tagline,
    };

    await this.prisma.sectionMeta.upsert({
      where: { key: VIEWING_PAGE_META_KEY },
      create: {
        key: VIEWING_PAGE_META_KEY,
        value: JSON.stringify(next),
      },
      update: { value: JSON.stringify(next) },
    });

    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'live.viewing_page',
      resourceId: VIEWING_PAGE_META_KEY,
      metadata: { enabled: next.enabled },
    });

    return next;
  }

  private async loadSettings(): Promise<ViewingPageSettings> {
    const row = await this.prisma.sectionMeta.findUnique({
      where: { key: VIEWING_PAGE_META_KEY },
    });
    if (!row?.value) return { ...DEFAULT_VIEWING_PAGE_SETTINGS };
    try {
      const parsed = JSON.parse(row.value) as Partial<ViewingPageSettings>;
      return {
        enabled:
          typeof parsed.enabled === 'boolean'
            ? parsed.enabled
            : DEFAULT_VIEWING_PAGE_SETTINGS.enabled,
        brandTitle: normalizeText(
          parsed.brandTitle,
          DEFAULT_VIEWING_PAGE_SETTINGS.brandTitle,
          80,
        ),
        pageTitle: normalizeText(
          parsed.pageTitle,
          DEFAULT_VIEWING_PAGE_SETTINGS.pageTitle,
          120,
        ),
        tagline:
          typeof parsed.tagline === 'string'
            ? parsed.tagline.trim().slice(0, 200)
            : DEFAULT_VIEWING_PAGE_SETTINGS.tagline,
      };
    } catch {
      return { ...DEFAULT_VIEWING_PAGE_SETTINGS };
    }
  }
}

function normalizeText(
  value: string | null | undefined,
  fallback: string,
  max: number,
) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return fallback;
  return trimmed.slice(0, max);
}
