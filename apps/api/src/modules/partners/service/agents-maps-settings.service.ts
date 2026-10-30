import { Injectable } from '@nestjs/common';
import { PrismaPartnersService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import {
  AGENTS_MAPS_SETTINGS_META_KEY,
  DEFAULT_AGENTS_MAPS_SETTINGS,
  type AgentsMapsSettings,
} from '../constants/agents-maps-settings';
import { UpdateAgentsMapsSettingsDto } from '../dto/update-agents-maps-settings.dto';

@Injectable()
export class AgentsMapsSettingsService {
  constructor(
    private readonly prisma: PrismaPartnersService,
    private readonly audit: AuditService,
  ) {}

  getSettings() {
    return this.loadSettings();
  }

  async updateSettings(dto: UpdateAgentsMapsSettingsDto, actorId: string) {
    const current = await this.loadSettings();
    const next: AgentsMapsSettings = {
      googleMapsApiKey:
        typeof dto.googleMapsApiKey === 'string'
          ? dto.googleMapsApiKey.trim()
          : current.googleMapsApiKey,
    };

    await this.prisma.sectionMeta.upsert({
      where: { key: AGENTS_MAPS_SETTINGS_META_KEY },
      create: {
        key: AGENTS_MAPS_SETTINGS_META_KEY,
        value: JSON.stringify(next),
      },
      update: { value: JSON.stringify(next) },
    });

    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'partners.agents.maps',
      resourceId: AGENTS_MAPS_SETTINGS_META_KEY,
      metadata: { hasKey: next.googleMapsApiKey.length > 0 },
    });

    return next;
  }

  private async loadSettings(): Promise<AgentsMapsSettings> {
    const row = await this.prisma.sectionMeta.findUnique({
      where: { key: AGENTS_MAPS_SETTINGS_META_KEY },
    });
    if (!row?.value) return { ...DEFAULT_AGENTS_MAPS_SETTINGS };
    try {
      const parsed = JSON.parse(row.value) as Partial<AgentsMapsSettings>;
      return {
        googleMapsApiKey:
          typeof parsed.googleMapsApiKey === 'string'
            ? parsed.googleMapsApiKey
            : '',
      };
    } catch {
      return { ...DEFAULT_AGENTS_MAPS_SETTINGS };
    }
  }
}
