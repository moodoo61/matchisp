import { Injectable } from '@nestjs/common';
import { PrismaLiveService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';
import { GeneralSettingsService } from '../../../settings/general/service/general-settings.service';
import { MistJwtService } from '../../service/mist/mist-jwt.service';
import {
  DEFAULT_VIEWING_PAGE_SETTINGS,
  VIEWING_PAGE_META_KEY,
  type ViewingPageSettings,
} from '../constants/viewing-page';
import { UpdateViewingPageDto } from '../dto/update-viewing-page.dto';

type StoredViewingPageSettings = Omit<
  ViewingPageSettings,
  'brandTitle' | 'brandLogoUrl' | 'brandLogoAbsoluteUrl'
> & {
  /** قديم في التخزين — يُتجاهل لصالح brandName من الإعدادات العامة */
  brandTitle?: string;
};

function boolOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function optionalText(
  value: unknown,
  fallback: string,
  max: number,
): string {
  if (typeof value !== 'string') return fallback;
  return value.trim().slice(0, max);
}

@Injectable()
export class ViewingPageService {
  constructor(
    private readonly prisma: PrismaLiveService,
    private readonly generalSettings: GeneralSettingsService,
    private readonly audit: AuditService,
    private readonly mistJwt: MistJwtService,
  ) {}

  async getSettings(): Promise<ViewingPageSettings> {
    return this.loadSettings();
  }

  async getPublicSettings(): Promise<ViewingPageSettings> {
    return this.loadSettings();
  }

  async updateSettings(dto: UpdateViewingPageDto, actorId: string) {
    const current = await this.loadStoredSettings();
    const nextJwt = boolOr(dto.jwtPlaybackEnabled, current.jwtPlaybackEnabled);

    if (nextJwt) {
      await this.mistJwt.ensureViewerProtection();
    } else if (current.jwtPlaybackEnabled) {
      await this.mistJwt.removeViewerProtection();
    }

    const next: StoredViewingPageSettings = {
      enabled: dto.enabled ?? current.enabled,
      pageTitle: normalizeText(dto.pageTitle, current.pageTitle, 120),
      tagline:
        dto.tagline !== undefined
          ? dto.tagline.trim().slice(0, 200)
          : current.tagline,
      brandSubtitle:
        dto.brandSubtitle !== undefined
          ? dto.brandSubtitle.trim().slice(0, 80)
          : current.brandSubtitle,
      liveBadgeText:
        dto.liveBadgeText !== undefined
          ? dto.liveBadgeText.trim().slice(0, 40)
          : current.liveBadgeText,
      showBrandTitle: boolOr(dto.showBrandTitle, current.showBrandTitle),
      showBrandLogo: boolOr(dto.showBrandLogo, current.showBrandLogo),
      showBrandSubtitle: boolOr(
        dto.showBrandSubtitle,
        current.showBrandSubtitle,
      ),
      showLiveBadge: boolOr(dto.showLiveBadge, current.showLiveBadge),
      showMatchSchedule: boolOr(
        dto.showMatchSchedule,
        current.showMatchSchedule,
      ),
      autoplayOnEnter: boolOr(dto.autoplayOnEnter, current.autoplayOnEnter),
      jwtPlaybackEnabled: nextJwt,
      playerTsEnabled: boolOr(dto.playerTsEnabled, current.playerTsEnabled),
      playerHlsEnabled: boolOr(dto.playerHlsEnabled, current.playerHlsEnabled),
    };

    // إن عُطّل الاثنان أبقِ HLS مفعّلاً حتى لا تُغلق المشاهدة
    if (!next.playerTsEnabled && !next.playerHlsEnabled) {
      next.playerHlsEnabled = true;
    }

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
      metadata: {
        enabled: next.enabled,
        jwtPlaybackEnabled: next.jwtPlaybackEnabled,
        playerTsEnabled: next.playerTsEnabled,
        playerHlsEnabled: next.playerHlsEnabled,
      },
    });

    return this.withBrandFromGeneral(next);
  }

  private async loadSettings(): Promise<ViewingPageSettings> {
    const stored = await this.loadStoredSettings();
    return this.withBrandFromGeneral(stored);
  }

  private async loadStoredSettings(): Promise<StoredViewingPageSettings> {
    const defaults: StoredViewingPageSettings = {
      enabled: DEFAULT_VIEWING_PAGE_SETTINGS.enabled,
      pageTitle: DEFAULT_VIEWING_PAGE_SETTINGS.pageTitle,
      tagline: DEFAULT_VIEWING_PAGE_SETTINGS.tagline,
      brandSubtitle: DEFAULT_VIEWING_PAGE_SETTINGS.brandSubtitle,
      liveBadgeText: DEFAULT_VIEWING_PAGE_SETTINGS.liveBadgeText,
      showBrandTitle: DEFAULT_VIEWING_PAGE_SETTINGS.showBrandTitle,
      showBrandLogo: DEFAULT_VIEWING_PAGE_SETTINGS.showBrandLogo,
      showBrandSubtitle: DEFAULT_VIEWING_PAGE_SETTINGS.showBrandSubtitle,
      showLiveBadge: DEFAULT_VIEWING_PAGE_SETTINGS.showLiveBadge,
      showMatchSchedule: DEFAULT_VIEWING_PAGE_SETTINGS.showMatchSchedule,
      autoplayOnEnter: DEFAULT_VIEWING_PAGE_SETTINGS.autoplayOnEnter,
      jwtPlaybackEnabled: DEFAULT_VIEWING_PAGE_SETTINGS.jwtPlaybackEnabled,
      playerTsEnabled: DEFAULT_VIEWING_PAGE_SETTINGS.playerTsEnabled,
      playerHlsEnabled: DEFAULT_VIEWING_PAGE_SETTINGS.playerHlsEnabled,
    };

    const row = await this.prisma.sectionMeta.findUnique({
      where: { key: VIEWING_PAGE_META_KEY },
    });
    if (!row?.value) return defaults;

    try {
      const parsed = JSON.parse(row.value) as Partial<ViewingPageSettings>;
      return {
        enabled: boolOr(parsed.enabled, defaults.enabled),
        pageTitle: normalizeText(parsed.pageTitle, defaults.pageTitle, 120),
        tagline: optionalText(parsed.tagline, defaults.tagline, 200),
        brandSubtitle: optionalText(
          parsed.brandSubtitle,
          defaults.brandSubtitle,
          80,
        ),
        liveBadgeText: optionalText(
          parsed.liveBadgeText,
          defaults.liveBadgeText,
          40,
        ),
        showBrandTitle: boolOr(parsed.showBrandTitle, defaults.showBrandTitle),
        showBrandLogo: boolOr(parsed.showBrandLogo, defaults.showBrandLogo),
        showBrandSubtitle: boolOr(
          parsed.showBrandSubtitle,
          defaults.showBrandSubtitle,
        ),
        showLiveBadge: boolOr(parsed.showLiveBadge, defaults.showLiveBadge),
        showMatchSchedule: boolOr(
          parsed.showMatchSchedule,
          defaults.showMatchSchedule,
        ),
        autoplayOnEnter: boolOr(
          parsed.autoplayOnEnter,
          defaults.autoplayOnEnter,
        ),
        jwtPlaybackEnabled: boolOr(
          parsed.jwtPlaybackEnabled,
          defaults.jwtPlaybackEnabled,
        ),
        playerTsEnabled: boolOr(
          parsed.playerTsEnabled,
          defaults.playerTsEnabled,
        ),
        playerHlsEnabled: boolOr(
          parsed.playerHlsEnabled,
          defaults.playerHlsEnabled,
        ),
      };
    } catch {
      return defaults;
    }
  }

  /** يحقن اسم/شعار العلامة فقط من الإعدادات العامة — لا systemName */
  private async withBrandFromGeneral(
    settings: StoredViewingPageSettings,
  ): Promise<ViewingPageSettings> {
    const general = await this.generalSettings.get();
    return {
      ...settings,
      brandTitle: (general.brandName ?? '').trim().slice(0, 120),
      brandLogoUrl: (general.brandLogoUrl ?? '').trim(),
      brandLogoAbsoluteUrl: general.brandLogoAbsoluteUrl ?? null,
    };
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
