import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/core';
import { PrismaCoreService } from '../../database/database.module';

export type AuditInput = {
  actorId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaCoreService) {}

  async log(input: AuditInput) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? null,
        metadata: input.metadata ?? undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  async list(params: {
    page?: number;
    pageSize?: number;
    resource?: string;
    action?: string;
  }) {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const where: Prisma.AuditLogWhereInput = {};
    if (params.resource) where.resource = params.resource;
    if (params.action) where.action = params.action;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, name: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }
}
