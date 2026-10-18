import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaCommsService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { AsteriskConfigService } from '../asterisk/asterisk-config.service';
import { AsteriskStatusService } from '../asterisk/asterisk-status.service';
import { CreateExtensionDto } from '../dto/create-extension.dto';
import { UpdateExtensionDto } from '../dto/update-extension.dto';

export type ExtensionPresence = 'unknown' | 'online' | 'offline' | 'busy';

export type ExtensionListItem = {
  id: string;
  number: string;
  displayName: string;
  enabled: boolean;
  context: string;
  createdAt: string;
  updatedAt: string;
  presence: ExtensionPresence;
  contacts: number | null;
};

@Injectable()
export class ExtensionsService {
  constructor(
    private readonly prisma: PrismaCommsService,
    private readonly audit: AuditService,
    private readonly config: AsteriskConfigService,
    private readonly status: AsteriskStatusService,
  ) {}

  async list(): Promise<ExtensionListItem[]> {
    const rows = await this.prisma.extension.findMany({
      orderBy: { number: 'asc' },
    });
    const presenceMap = await this.loadPresenceMap();
    return rows.map((row) => {
      const p = presenceMap.get(row.number);
      return {
        id: row.id,
        number: row.number,
        displayName: row.displayName,
        enabled: row.enabled,
        context: row.context,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        presence: p?.presence ?? 'unknown',
        contacts: p?.contacts ?? null,
      };
    });
  }

  async create(dto: CreateExtensionDto, actorId: string) {
    const number = dto.number.trim();
    const existing = await this.prisma.extension.findUnique({
      where: { number },
    });
    if (existing) {
      throw new ConflictException(`الرقم ${number} موجود مسبقاً`);
    }

    const row = await this.prisma.extension.create({
      data: {
        number,
        displayName: dto.displayName.trim(),
        secret: dto.secret,
        enabled: dto.enabled ?? true,
        context: dto.context?.trim() || 'from-internal',
      },
    });

    await this.resyncAll();
    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'comms.extension',
      resourceId: row.id,
      metadata: { number: row.number },
    });

    return this.toDto(row);
  }

  async update(id: string, dto: UpdateExtensionDto, actorId: string) {
    const existing = await this.prisma.extension.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('الرقم غير موجود');

    const row = await this.prisma.extension.update({
      where: { id },
      data: {
        displayName: dto.displayName?.trim() ?? undefined,
        secret: dto.secret ?? undefined,
        enabled: dto.enabled ?? undefined,
        context: dto.context?.trim() ?? undefined,
      },
    });

    await this.resyncAll();
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'comms.extension',
      resourceId: row.id,
      metadata: { number: row.number },
    });

    return this.toDto(row);
  }

  async remove(id: string, actorId: string) {
    const existing = await this.prisma.extension.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('الرقم غير موجود');

    await this.prisma.extension.delete({ where: { id } });
    await this.resyncAll();
    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'comms.extension',
      resourceId: id,
      metadata: { number: existing.number },
    });

    return { ok: true };
  }

  private async resyncAll() {
    const all = await this.prisma.extension.findMany({
      orderBy: { number: 'asc' },
    });
    try {
      await this.config.syncExtensions(all);
    } catch (err) {
      throw new BadRequestException(
        `حُفظ الرقم في القاعدة لكن فشلت المزامنة مع Asterisk: ${
          err instanceof Error ? err.message : err
        }`,
      );
    }
  }

  private async loadPresenceMap(): Promise<
    Map<string, { presence: ExtensionPresence; contacts: number }>
  > {
    const map = new Map<string, { presence: ExtensionPresence; contacts: number }>();
    try {
      const ami = this.status.createClient();
      const endpoints = await ami.pjsipShowEndpoints();
      for (const ep of endpoints) {
        const number = ep.ObjectName || ep.Endpoint || '';
        if (!number) continue;
        const device = (ep.DeviceState || '').toUpperCase();
        const active = Number(ep.ActiveChannels || 0);
        const contactsRaw = ep.Contacts || '0';
        const contactCount =
          contactsRaw === '0' || !contactsRaw
            ? 0
            : contactsRaw.includes('/')
              ? contactsRaw.split(',').filter(Boolean).length
              : Number(contactsRaw) || 0;

        let presence: ExtensionPresence = 'offline';
        if (device === 'INUSE' || active > 0) presence = 'busy';
        else if (device === 'NOT_INUSE' || contactCount > 0) presence = 'online';
        else if (device === 'UNAVAILABLE' || device === 'INVALID' || !device) {
          presence = contactCount > 0 ? 'online' : 'offline';
        }

        map.set(number, { presence, contacts: contactCount });
      }
    } catch {
      /* AMI غير متاح — نعرض unknown */
    }
    return map;
  }

  private toDto(row: {
    id: string;
    number: string;
    displayName: string;
    enabled: boolean;
    context: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      number: row.number,
      displayName: row.displayName,
      enabled: row.enabled,
      context: row.context,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
