import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaCommsService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import {
  COMMS_DISCOVERY_META_KEY,
  COMMS_DISCOVERY_PORTS,
  DEFAULT_COMMS_DISCOVERY_SETTINGS,
  isCommsDiscoveryPort,
  type CommsDiscoverySettingsDto,
  type CommsDiscoveryStoredSettings,
} from '../constants/discovery-ports';
import { UpdateCommsDiscoverySettingsDto } from '../dto/update-comms-discovery-settings.dto';
import { CommsAndroidApkService } from './comms-android-apk.service';
import { CommsDiscoveryBeaconService } from './comms-discovery-beacon.service';

@Injectable()
export class CommsDiscoverySettingsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaCommsService,
    private readonly audit: AuditService,
    private readonly beacon: CommsDiscoveryBeaconService,
    private readonly apk: CommsAndroidApkService,
  ) {}

  async onModuleInit() {
    const stored = await this.loadStored();
    await this.beacon.applySettings(stored);
  }

  async getSettings(): Promise<CommsDiscoverySettingsDto> {
    const stored = await this.loadStored();
    return {
      ...stored,
      allowedPorts: COMMS_DISCOVERY_PORTS,
      listening: this.beacon.isListening(),
      listenError: this.beacon.getListenError(),
      apkAvailable: this.apk.isAvailable(),
      apkDownloadPath: this.apk.publicDownloadPath(),
    };
  }

  /** إعدادات عامة لصفحة /call (بدون أسرار) */
  async getPublicDownloadInfo(): Promise<{
    showDownloadButton: boolean;
    available: boolean;
    downloadPath: string;
  }> {
    const stored = await this.loadStored();
    const available = this.apk.isAvailable();
    return {
      showDownloadButton: stored.showDownloadButton && available,
      available,
      downloadPath: this.apk.publicDownloadPath(),
    };
  }

  async updateSettings(
    dto: UpdateCommsDiscoverySettingsDto,
    actorId: string,
  ): Promise<CommsDiscoverySettingsDto> {
    const current = await this.loadStored();
    const next: CommsDiscoveryStoredSettings = {
      enabled:
        typeof dto.enabled === 'boolean' ? dto.enabled : current.enabled,
      port:
        typeof dto.port === 'number' && isCommsDiscoveryPort(dto.port)
          ? dto.port
          : current.port,
      displayName: normalizeDisplayName(dto.displayName, current.displayName),
      showDownloadButton:
        typeof dto.showDownloadButton === 'boolean'
          ? dto.showDownloadButton
          : current.showDownloadButton,
    };

    await this.prisma.sectionMeta.upsert({
      where: { key: COMMS_DISCOVERY_META_KEY },
      create: {
        key: COMMS_DISCOVERY_META_KEY,
        value: JSON.stringify(next),
      },
      update: { value: JSON.stringify(next) },
    });

    await this.beacon.applySettings(next);

    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'comms.discovery',
      resourceId: COMMS_DISCOVERY_META_KEY,
      metadata: {
        enabled: next.enabled,
        port: next.port,
        displayName: next.displayName,
        showDownloadButton: next.showDownloadButton,
      },
    });

    return this.getSettings();
  }

  async loadStored(): Promise<CommsDiscoveryStoredSettings> {
    const row = await this.prisma.sectionMeta.findUnique({
      where: { key: COMMS_DISCOVERY_META_KEY },
    });
    if (!row?.value) {
      return structuredClone(DEFAULT_COMMS_DISCOVERY_SETTINGS);
    }
    try {
      const parsed = JSON.parse(
        row.value,
      ) as Partial<CommsDiscoveryStoredSettings>;
      const port =
        typeof parsed.port === 'number' && isCommsDiscoveryPort(parsed.port)
          ? parsed.port
          : DEFAULT_COMMS_DISCOVERY_SETTINGS.port;
      return {
        enabled:
          typeof parsed.enabled === 'boolean'
            ? parsed.enabled
            : DEFAULT_COMMS_DISCOVERY_SETTINGS.enabled,
        port,
        displayName: normalizeDisplayName(
          parsed.displayName,
          DEFAULT_COMMS_DISCOVERY_SETTINGS.displayName,
        ),
        showDownloadButton:
          typeof parsed.showDownloadButton === 'boolean'
            ? parsed.showDownloadButton
            : DEFAULT_COMMS_DISCOVERY_SETTINGS.showDownloadButton,
      };
    } catch {
      return structuredClone(DEFAULT_COMMS_DISCOVERY_SETTINGS);
    }
  }
}

function normalizeDisplayName(
  value: string | undefined,
  fallback: string,
): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return fallback;
  return trimmed.slice(0, 64);
}
