import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaMaintenanceService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { CreatePartsRequestDto } from '../dto/create-parts-request.dto';
import { UpdatePartsRequestDto } from '../dto/update-parts-request.dto';
import {
  assertWorkOrderTransition,
  type TransitionRole,
} from '../lib/assert-transition';
import { MaintenanceUsersService } from './maintenance-users.service';

@Injectable()
export class PartsRequestsService {
  constructor(
    private readonly prisma: PrismaMaintenanceService,
    private readonly audit: AuditService,
    private readonly users: MaintenanceUsersService,
  ) {}

  async listOpen() {
    const rows = await this.prisma.partsRequest.findMany({
      where: { status: { in: ['open', 'acknowledged'] } },
      include: {
        workOrder: {
          select: {
            id: true,
            number: true,
            title: true,
            status: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return this.enrich(rows);
  }

  async listForWorkOrder(workOrderId: string) {
    const rows = await this.prisma.partsRequest.findMany({
      where: { workOrderId },
      include: {
        workOrder: {
          select: {
            id: true,
            number: true,
            title: true,
            status: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.enrich(rows);
  }

  async create(
    workOrderId: string,
    dto: CreatePartsRequestDto,
    actorId: string,
    roles: TransitionRole[],
  ) {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
    });
    if (!wo) throw new NotFoundException('أمر العمل غير موجود');
    if (
      wo.status !== 'in_progress' &&
      wo.status !== 'rework' &&
      wo.status !== 'waiting_parts'
    ) {
      throw new BadRequestException(
        'طلب القطع متاح أثناء التنفيذ أو بانتظار مواد',
      );
    }
    if (wo.assigneeUserId !== actorId && !roles.includes('supervise')) {
      throw new BadRequestException('فقط الفني المعيَّن يطلب القطع');
    }

    const setWaiting = dto.setWaiting !== false && wo.status !== 'waiting_parts';

    const result = await this.prisma.$transaction(async (tx) => {
      const parts = await tx.partsRequest.create({
        data: {
          workOrderId,
          requestedById: actorId,
          description: dto.description.trim(),
          quantity: dto.quantity ?? 1,
        },
        include: {
          workOrder: {
            select: {
              id: true,
              number: true,
              title: true,
              status: true,
              type: true,
            },
          },
        },
      });

      if (setWaiting) {
        assertWorkOrderTransition(wo.status, 'waiting_parts', roles);
        await tx.statusEvent.create({
          data: {
            workOrderId,
            fromStatus: wo.status,
            toStatus: 'waiting_parts',
            actorId,
            reason: `طلب قطع: ${parts.description}`,
          },
        });
        await tx.workOrder.update({
          where: { id: workOrderId },
          data: { status: 'waiting_parts' },
        });
      }

      return parts;
    });

    await this.audit.log({
      actorId,
      action: 'parts_request',
      resource: 'maintenance.parts_request',
      resourceId: result.id,
      metadata: {
        workOrderId,
        number: wo.number,
        description: result.description,
      },
    });

    return (await this.enrich([result]))[0];
  }

  async updateStatus(
    id: string,
    dto: UpdatePartsRequestDto,
    actorId: string,
    roles: TransitionRole[],
  ) {
    const row = await this.prisma.partsRequest.findUnique({
      where: { id },
      include: { workOrder: true },
    });
    if (!row) throw new NotFoundException('طلب القطع غير موجود');
    if (row.status === 'fulfilled' || row.status === 'rejected') {
      throw new BadRequestException('الطلب مغلق ولا يُعدَّل');
    }
    if (dto.status === 'rejected' && !dto.rejectReason?.trim()) {
      throw new BadRequestException('سبب الرفض مطلوب');
    }

    const resume =
      dto.status === 'fulfilled' &&
      dto.resumeWorkOrder !== false &&
      row.workOrder.status === 'waiting_parts';

    const updated = await this.prisma.$transaction(async (tx) => {
      const parts = await tx.partsRequest.update({
        where: { id },
        data: {
          status: dto.status,
          rejectReason:
            dto.status === 'rejected' ? dto.rejectReason!.trim() : null,
        },
        include: {
          workOrder: {
            select: {
              id: true,
              number: true,
              title: true,
              status: true,
              type: true,
            },
          },
        },
      });

      if (resume) {
        const openLeft = await tx.partsRequest.count({
          where: {
            workOrderId: row.workOrderId,
            status: { in: ['open', 'acknowledged'] },
            id: { not: id },
          },
        });
        if (openLeft === 0) {
          assertWorkOrderTransition(
            'waiting_parts',
            'in_progress',
            roles,
          );
          await tx.statusEvent.create({
            data: {
              workOrderId: row.workOrderId,
              fromStatus: 'waiting_parts',
              toStatus: 'in_progress',
              actorId,
              reason: 'صُرفت المواد',
            },
          });
          await tx.workOrder.update({
            where: { id: row.workOrderId },
            data: { status: 'in_progress' },
          });
          parts.workOrder.status = 'in_progress';
        }
      }

      return parts;
    });

    await this.audit.log({
      actorId,
      action: `parts_${dto.status}`,
      resource: 'maintenance.parts_request',
      resourceId: id,
      metadata: { workOrderId: row.workOrderId },
    });

    return (await this.enrich([updated]))[0];
  }

  private async enrich<
    T extends {
      requestedById: string;
      workOrder: {
        id: string;
        number: number;
        title: string;
        status: string;
        type: string;
      };
    },
  >(rows: T[]) {
    const users = await this.users.loadMap(rows.map((r) => r.requestedById));
    return rows.map((r) => ({
      ...r,
      requestedBy: this.users.brief(users, r.requestedById),
    }));
  }
}
