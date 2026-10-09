import { Injectable, Logger } from '@nestjs/common';
import { PrismaNetworkService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';
import {
  DEFAULT_SSTP_SETTINGS,
  SSTP_SETTINGS_ID,
} from '../constants/sstp';
import { UpdateSstpSettingsDto } from '../dto/update-sstp-settings.dto';
import { writeSstpBootEnv } from './sstp-boot-env';

@Injectable()
export class SstpSettingsService {
  private readonly logger = new Logger(SstpSettingsService.name);

  constructor(
    private readonly prisma: PrismaNetworkService,
    private readonly audit: AuditService,
  ) {}

  async get() {
    const row = await this.ensureRow();
    return this.toDto(row);
  }

  async getSecrets() {
    return this.ensureRow();
  }

  async update(dto: UpdateSstpSettingsDto, actorId: string) {
    await this.ensureRow();
    const data: {
      host?: string;
      username?: string;
      password?: string;
      certWarn?: boolean;
      tlsExt?: boolean;
      autoConnect?: boolean;
    } = {};

    if (dto.host !== undefined) data.host = dto.host.trim();
    if (dto.username !== undefined) data.username = dto.username.trim();
    if (dto.password !== undefined && dto.password.length > 0) {
      data.password = dto.password;
    }
    if (dto.certWarn !== undefined) data.certWarn = dto.certWarn;
    if (dto.tlsExt !== undefined) data.tlsExt = dto.tlsExt;
    if (dto.autoConnect !== undefined) data.autoConnect = dto.autoConnect;

    const updated = await this.prisma.sstpSettings.update({
      where: { id: SSTP_SETTINGS_ID },
      data,
    });

    this.syncBootEnv(updated);

    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'network.sstp',
      resourceId: updated.id,
      metadata: {
        host: updated.host,
        username: updated.username,
        passwordChanged: Boolean(data.password),
        certWarn: updated.certWarn,
        tlsExt: updated.tlsExt,
        autoConnect: updated.autoConnect,
      },
    });

    return this.toDto(updated);
  }

  /** يزامن boot.env لخدمة match-sstp */
  syncBootEnv(row: {
    host: string;
    username: string;
    password: string;
    certWarn: boolean;
    tlsExt: boolean;
    autoConnect: boolean;
  }): void {
    try {
      writeSstpBootEnv(row);
    } catch (err) {
      this.logger.warn(
        `تعذر كتابة SSTP boot.env: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  private async ensureRow() {
    const existing = await this.prisma.sstpSettings.findUnique({
      where: { id: SSTP_SETTINGS_ID },
    });
    if (existing) {
      this.syncBootEnv(existing);
      return existing;
    }
    const created = await this.prisma.sstpSettings.create({
      data: {
        id: SSTP_SETTINGS_ID,
        host: DEFAULT_SSTP_SETTINGS.host,
        username: DEFAULT_SSTP_SETTINGS.username,
        password: DEFAULT_SSTP_SETTINGS.password,
        certWarn: DEFAULT_SSTP_SETTINGS.certWarn,
        tlsExt: DEFAULT_SSTP_SETTINGS.tlsExt,
        autoConnect: DEFAULT_SSTP_SETTINGS.autoConnect,
      },
    });
    this.syncBootEnv(created);
    return created;
  }

  private toDto(row: {
    id: string;
    host: string;
    username: string;
    password: string;
    certWarn: boolean;
    tlsExt: boolean;
    autoConnect: boolean;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      host: row.host,
      username: row.username,
      passwordSet: Boolean(row.password),
      certWarn: row.certWarn,
      tlsExt: row.tlsExt,
      autoConnect: row.autoConnect,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
