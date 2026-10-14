import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaMaintenanceService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { MaintenanceUsersService } from './maintenance-users.service';

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaMaintenanceService,
    private readonly audit: AuditService,
    private readonly users: MaintenanceUsersService,
  ) {}

  async list() {
    const rows = await this.prisma.asset.findMany({
      include: {
        _count: {
          select: { workOrders: true, requests: true },
        },
      },
      orderBy: [{ kind: 'asc' }, { label: 'asc' }],
    });
    return rows.map(({ _count, ...r }) => ({
      ...r,
      workOrdersCount: _count.workOrders,
      requestsCount: _count.requests,
    }));
  }

  async get(id: string) {
    const row = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        workOrders: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            number: true,
            title: true,
            type: true,
            status: true,
            priority: true,
            assigneeUserId: true,
            fieldFinishedAt: true,
            closedAt: true,
            createdAt: true,
          },
        },
        requests: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            number: true,
            title: true,
            status: true,
            workType: true,
            priority: true,
            createdAt: true,
          },
        },
      },
    });
    if (!row) throw new NotFoundException('الأصل غير موجود');
    const users = await this.users.loadMap(
      row.workOrders
        .map((w) => w.assigneeUserId)
        .filter((x): x is string => Boolean(x)),
    );
    return {
      ...row,
      workOrders: row.workOrders.map((w) => ({
        ...w,
        assignee: this.users.brief(users, w.assigneeUserId),
      })),
    };
  }

  async create(dto: CreateAssetDto, actorId: string) {
    const row = await this.prisma.asset.create({
      data: {
        kind: dto.kind,
        label: dto.label.trim(),
        externalRef: dto.externalRef?.trim() || null,
        notes: dto.notes?.trim() ?? '',
      },
    });
    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'maintenance.asset',
      resourceId: row.id,
      metadata: { kind: row.kind, label: row.label },
    });
    return row;
  }
}
