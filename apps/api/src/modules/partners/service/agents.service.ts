import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaPartnersService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { CreateAgentDto } from '../dto/create-agent.dto';
import { UpdateAgentDto } from '../dto/update-agent.dto';
import { AgentsPublicApiSettingsService } from './agents-public-api-settings.service';
import type { AgentsPublicApiFields } from '../constants/agents-public-api-settings';

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaPartnersService,
    private readonly audit: AuditService,
    private readonly publicApiSettings: AgentsPublicApiSettingsService,
  ) {}

  list() {
    return this.prisma.agent.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async get(id: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id } });
    if (!agent) throw new NotFoundException('الوكيل غير موجود');
    return agent;
  }

  async create(dto: CreateAgentDto, actorId: string) {
    const agent = await this.prisma.agent.create({
      data: {
        name: dto.name.trim(),
        shopName: dto.shopName.trim(),
        region: (dto.region ?? 'أخرى').trim() || 'أخرى',
        address: dto.address.trim(),
        phone: dto.phone.trim(),
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isPublic: dto.isPublic ?? true,
      },
    });

    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'partners.agent',
      resourceId: agent.id,
      metadata: {
        name: agent.name,
        shopName: agent.shopName,
        region: agent.region,
        isPublic: agent.isPublic,
      },
    });

    return agent;
  }

  async update(id: string, dto: UpdateAgentDto, actorId: string) {
    await this.get(id);

    const agent = await this.prisma.agent.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        shopName: dto.shopName?.trim(),
        region:
          dto.region !== undefined
            ? dto.region.trim() || 'أخرى'
            : undefined,
        address: dto.address?.trim(),
        phone: dto.phone?.trim(),
        ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
        ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isPublic !== undefined ? { isPublic: dto.isPublic } : {}),
      },
    });

    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'partners.agent',
      resourceId: agent.id,
      metadata: { fields: Object.keys(dto) },
    });

    return agent;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.get(id);
    await this.prisma.agent.delete({ where: { id } });

    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'partners.agent',
      resourceId: id,
      metadata: { name: existing.name, shopName: existing.shopName },
    });

    return { success: true };
  }

  /** قائمة عامة متوافقة مع سكربت نقاط المبيعات */
  async listPublic() {
    const settings = await this.publicApiSettings.getSettings();
    if (!settings.enabled) return [];

    const items = await this.prisma.agent.findMany({
      where: { isPublic: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return items
      .filter((agent) => agent.name.trim() !== '')
      .map((agent) => mapPublicAgent(agent, settings.fields));
  }
}

function mapPublicAgent(
  agent: {
    name: string;
    region: string;
    address: string;
    shopName: string;
    phone: string;
    sortOrder: number;
    latitude: number | null;
    longitude: number | null;
  },
  fields: AgentsPublicApiFields,
) {
  const row: Record<string, string | number> = {};
  if (fields.name) row.name = agent.name.trim();
  if (fields.region) row.region = agent.region.trim() || 'أخرى';
  if (fields.address) row.address = agent.address.trim();
  if (fields.shopName) row.shopName = agent.shopName.trim();
  if (fields.phone) row.phone = agent.phone.trim();
  if (fields.order) row.order = agent.sortOrder;
  if (fields.latitude && agent.latitude != null) row.latitude = agent.latitude;
  if (fields.longitude && agent.longitude != null) {
    row.longitude = agent.longitude;
  }
  return row;
}
