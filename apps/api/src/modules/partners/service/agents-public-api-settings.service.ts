import { Injectable } from '@nestjs/common';
import { PrismaPartnersService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import {
  AGENTS_PUBLIC_SETTINGS_META_KEY,
  DEFAULT_AGENTS_PUBLIC_API_SETTINGS,
  type AgentsPublicApiFields,
  type AgentsPublicApiSettings,
} from '../constants/agents-public-api-settings';
import { UpdateAgentsPublicApiSettingsDto } from '../dto/update-agents-public-api-settings.dto';

@Injectable()
export class AgentsPublicApiSettingsService {
  constructor(
    private readonly prisma: PrismaPartnersService,
    private readonly audit: AuditService,
  ) {}

  getSettings() {
    return this.loadSettings();
  }

  async updateSettings(
    dto: UpdateAgentsPublicApiSettingsDto,
    actorId: string,
  ) {
    const current = await this.loadSettings();
    const next: AgentsPublicApiSettings = {
      enabled:
        typeof dto.enabled === 'boolean' ? dto.enabled : current.enabled,
      fields: {
        ...current.fields,
        ...(dto.fields ?? {}),
      },
    };

    await this.prisma.sectionMeta.upsert({
      where: { key: AGENTS_PUBLIC_SETTINGS_META_KEY },
      create: {
        key: AGENTS_PUBLIC_SETTINGS_META_KEY,
        value: JSON.stringify(next),
      },
      update: { value: JSON.stringify(next) },
    });

    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'partners.agents.public_api',
      resourceId: AGENTS_PUBLIC_SETTINGS_META_KEY,
      metadata: { enabled: next.enabled, fields: next.fields },
    });

    return next;
  }

  private async loadSettings(): Promise<AgentsPublicApiSettings> {
    const row = await this.prisma.sectionMeta.findUnique({
      where: { key: AGENTS_PUBLIC_SETTINGS_META_KEY },
    });
    if (!row?.value) return structuredClone(DEFAULT_AGENTS_PUBLIC_API_SETTINGS);
    try {
      const parsed = JSON.parse(row.value) as Partial<AgentsPublicApiSettings>;
      return {
        enabled:
          typeof parsed.enabled === 'boolean'
            ? parsed.enabled
            : DEFAULT_AGENTS_PUBLIC_API_SETTINGS.enabled,
        fields: mergeFields(parsed.fields),
      };
    } catch {
      return structuredClone(DEFAULT_AGENTS_PUBLIC_API_SETTINGS);
    }
  }
}

function mergeFields(
  partial: Partial<AgentsPublicApiFields> | undefined,
): AgentsPublicApiFields {
  const base = { ...DEFAULT_AGENTS_PUBLIC_API_SETTINGS.fields };
  if (!partial) return base;
  for (const key of Object.keys(base) as (keyof AgentsPublicApiFields)[]) {
    if (typeof partial[key] === 'boolean') base[key] = partial[key]!;
  }
  return base;
}
