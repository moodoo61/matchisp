import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PrismaCoreService,
  PrismaMaintenanceService,
} from '../../../database/database.module';
import { PERMISSIONS } from '@isp/shared';
import { AuditService } from '../../audit/audit.service';
import { computeSlaDates, type WorkPriority } from '../constants/priority';
import type { WorkOrderStatus } from '../constants/work-order-status';
import { AssignWorkOrderDto } from '../dto/assign-work-order.dto';
import { CloseWorkOrderDto } from '../dto/close-work-order.dto';
import { FinishFieldDto } from '../dto/finish-field.dto';
import { ReasonDto } from '../dto/reason.dto';
import {
  assertWorkOrderTransition,
  type TransitionRole,
} from '../lib/assert-transition';
import { MaintenanceNotificationsService } from './maintenance-notifications.service';
import { MaintenanceUsersService } from './maintenance-users.service';
import { ServiceRequestsService } from './service-requests.service';

const INCLUDE = {
  asset: true,
  request: {
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
      workType: true,
    },
  },
  statusEvents: { orderBy: { createdAt: 'asc' as const } },
  partsRequests: { orderBy: { createdAt: 'desc' as const } },
  attachments: { orderBy: { createdAt: 'desc' as const } },
};

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly prisma: PrismaMaintenanceService,
    private readonly prismaCore: PrismaCoreService,
    private readonly audit: AuditService,
    private readonly users: MaintenanceUsersService,
    private readonly requests: ServiceRequestsService,
    private readonly notifications: MaintenanceNotificationsService,
  ) {}

  async list() {
    const rows = await this.prisma.workOrder.findMany({
      include: INCLUDE,
      orderBy: [{ createdAt: 'desc' }],
    });
    return this.enrichMany(rows);
  }

  async listMine(userId: string) {
    const rows = await this.prisma.workOrder.findMany({
      where: {
        assigneeUserId: userId,
        status: {
          in: [
            'assigned',
            'accepted',
            'in_progress',
            'waiting_parts',
            'waiting_access',
            'rework',
            'done_field',
          ],
        },
      },
      include: INCLUDE,
      orderBy: [{ resolveBy: 'asc' }, { number: 'desc' }],
    });
    return this.enrichMany(rows);
  }

  /** طابور مراجعة المشرف — منجزة فنياً بانتظار الاعتماد */
  async listPendingReview() {
    const rows = await this.prisma.workOrder.findMany({
      where: { status: 'done_field' },
      include: INCLUDE,
      orderBy: [{ fieldFinishedAt: 'asc' }, { number: 'asc' }],
    });
    return this.enrichMany(rows);
  }

  /**
   * سجل الصيانة المكتملة (مغلقة) — للبحث بتاريخ موقع/جهاز.
   */
  async listHistory(query: {
    assetId?: string;
    assetKind?: string;
    type?: string;
    q?: string;
  }) {
    const q = query.q?.trim();
    const rows = await this.prisma.workOrder.findMany({
      where: {
        status: 'closed',
        ...(query.assetId ? { assetId: query.assetId } : {}),
        ...(query.type ? { type: query.type } : {}),
        ...(query.assetKind
          ? { asset: { kind: query.assetKind } }
          : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { locationText: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { asset: { label: { contains: q, mode: 'insensitive' } } },
                {
                  asset: {
                    externalRef: { contains: q, mode: 'insensitive' },
                  },
                },
              ],
            }
          : {}),
      },
      include: INCLUDE,
      orderBy: [{ closedAt: 'desc' }, { number: 'desc' }],
      take: 200,
    });
    return this.enrichMany(rows);
  }

  async countPendingReview() {
    const count = await this.prisma.workOrder.count({
      where: { status: 'done_field' },
    });
    return { count };
  }

  async get(id: string) {
    return this.enrichOne(await this.getRaw(id));
  }

  async approve(id: string, actorId: string, roles: TransitionRole[]) {
    const row = await this.getRaw(id);
    assertWorkOrderTransition(row.status, 'approved', roles);
    const sla = computeSlaDates(row.priority as WorkPriority);
    return this.transition(row, 'approved', actorId, roles, {
      ...sla,
    });
  }

  async assign(
    id: string,
    dto: AssignWorkOrderDto,
    actorId: string,
    roles: TransitionRole[],
  ) {
    const row = await this.getRaw(id);
    if (
      row.status !== 'approved' &&
      row.status !== 'accepted' &&
      row.status !== 'assigned'
    ) {
      throw new BadRequestException('التعيين غير متاح لهذه الحالة');
    }
    if (row.status !== 'assigned') {
      assertWorkOrderTransition(row.status, 'assigned', roles);
    } else if (!roles.includes('dispatch') && !roles.includes('supervise')) {
      throw new BadRequestException('لا تملك صلاحية إعادة التعيين');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (row.status !== 'assigned') {
        await tx.statusEvent.create({
          data: {
            workOrderId: id,
            fromStatus: row.status,
            toStatus: 'assigned',
            actorId,
            reason: null,
          },
        });
      }
      return tx.workOrder.update({
        where: { id },
        data: {
          status: 'assigned',
          assigneeUserId: dto.assigneeUserId,
          assignmentRejectReason: null,
        },
        include: INCLUDE,
      });
    });

    await this.audit.log({
      actorId,
      action: 'assign',
      resource: 'maintenance.work_order',
      resourceId: id,
      metadata: {
        number: row.number,
        assigneeUserId: dto.assigneeUserId,
      },
    });
    await this.notifications.notify({
      workOrderId: id,
      workOrderNumber: row.number,
      title: `تعيين أمر عمل #${row.number}`,
      body: row.title,
      recipientUserIds: [dto.assigneeUserId],
      excludeUserId: actorId,
    });
    return this.enrichOne(updated);
  }

  async accept(id: string, actorId: string, roles: TransitionRole[]) {
    const row = await this.getRaw(id);
    if (row.assigneeUserId !== actorId) {
      throw new BadRequestException('فقط الفني المعيَّن يقبل الأمر');
    }
    return this.transition(row, 'accepted', actorId, roles);
  }

  async rejectAssignment(
    id: string,
    dto: ReasonDto,
    actorId: string,
    roles: TransitionRole[],
  ) {
    const row = await this.getRaw(id);
    if (row.assigneeUserId !== actorId && !roles.includes('supervise')) {
      throw new BadRequestException('فقط الفني المعيَّن يرفض التعيين');
    }
    assertWorkOrderTransition(row.status, 'approved', roles);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.statusEvent.create({
        data: {
          workOrderId: id,
          fromStatus: row.status,
          toStatus: 'approved',
          actorId,
          reason: dto.reason.trim(),
        },
      });
      return tx.workOrder.update({
        where: { id },
        data: {
          status: 'approved',
          assigneeUserId: null,
          assignmentRejectReason: dto.reason.trim(),
        },
        include: INCLUDE,
      });
    });
    await this.audit.log({
      actorId,
      action: 'reject_assignment',
      resource: 'maintenance.work_order',
      resourceId: id,
      metadata: { number: row.number, reason: dto.reason.trim() },
    });
    await this.notifications.notify({
      workOrderId: id,
      workOrderNumber: row.number,
      title: `رفض تعيين #${row.number}`,
      body: dto.reason.trim().slice(0, 140),
      recipientUserIds: [row.createdByUserId],
      excludeUserId: actorId,
    });
    return this.enrichOne(updated);
  }

  async start(id: string, actorId: string, roles: TransitionRole[]) {
    const row = await this.getRaw(id);
    if (row.assigneeUserId !== actorId) {
      throw new BadRequestException('فقط الفني المعيَّن يبدأ التنفيذ');
    }
    if (
      row.status !== 'assigned' &&
      row.status !== 'accepted' &&
      row.status !== 'rework'
    ) {
      throw new BadRequestException(
        'التنفيذ متاح بعد التعيين أو إعادة التنفيذ',
      );
    }
    return this.transition(row, 'in_progress', actorId, roles, {
      startedAt: row.startedAt ?? new Date(),
    });
  }

  async waitParts(id: string, actorId: string, roles: TransitionRole[]) {
    const row = await this.requireAssignee(id, actorId);
    return this.transition(row, 'waiting_parts', actorId, roles);
  }

  async waitAccess(id: string, actorId: string, roles: TransitionRole[]) {
    const row = await this.requireAssignee(id, actorId);
    return this.transition(row, 'waiting_access', actorId, roles);
  }

  async resume(id: string, actorId: string, roles: TransitionRole[]) {
    const row = await this.requireAssignee(id, actorId, true);
    return this.transition(row, 'in_progress', actorId, roles);
  }

  async finishField(
    id: string,
    dto: FinishFieldDto,
    actorId: string,
    roles: TransitionRole[],
  ) {
    const row = await this.requireAssignee(id, actorId);
    const updated = await this.transition(row, 'done_field', actorId, roles, {
      completionNotes: dto.completionNotes.trim(),
      rootCause: dto.rootCause?.trim() ?? row.rootCause,
      fieldFinishedAt: new Date(),
    });
    await this.notifications.notify({
      workOrderId: id,
      workOrderNumber: row.number,
      title: `بانتظار المراجعة #${row.number}`,
      body: dto.completionNotes.trim().slice(0, 140),
      recipientUserIds: await this.supervisorRecipients(row.createdByUserId),
      excludeUserId: actorId,
    });
    return updated;
  }

  async close(
    id: string,
    dto: CloseWorkOrderDto,
    actorId: string,
    roles: TransitionRole[],
  ) {
    const row = await this.getRaw(id);
    if (row.status !== 'done_field') {
      throw new BadRequestException(
        'الاعتماد متاح فقط للأوامر المنجزة فنياً',
      );
    }
    const reviewNotes = dto.reviewNotes?.trim() ?? '';
    const updated = await this.transition(
      row,
      'closed',
      actorId,
      roles,
      {
        closedAt: new Date(),
        reviewNotes,
        reviewedByUserId: actorId,
        reviewedAt: new Date(),
      },
      reviewNotes || 'اعتماد المشرف',
    );
    if (row.requestId) {
      await this.requests.closeIfAllWorkOrdersDone(row.requestId, actorId);
    }
    if (row.assigneeUserId) {
      await this.notifications.notify({
        workOrderId: id,
        workOrderNumber: row.number,
        title: `أُغلق أمر #${row.number}`,
        body: reviewNotes || 'تم اعتماد المراجعة',
        recipientUserIds: [row.assigneeUserId],
        excludeUserId: actorId,
      });
    }
    return updated;
  }

  async rework(
    id: string,
    dto: ReasonDto,
    actorId: string,
    roles: TransitionRole[],
  ) {
    const row = await this.getRaw(id);
    if (row.status !== 'done_field') {
      throw new BadRequestException(
        'إعادة التنفيذ متاحة بعد الإنجاز الفني فقط',
      );
    }
    const updated = await this.transition(
      row,
      'rework',
      actorId,
      roles,
      {
        reworkReason: dto.reason.trim(),
        fieldFinishedAt: null,
        reviewedByUserId: actorId,
        reviewedAt: new Date(),
        reviewNotes: '',
      },
      dto.reason.trim(),
    );
    if (row.assigneeUserId) {
      await this.notifications.notify({
        workOrderId: id,
        workOrderNumber: row.number,
        title: `إعادة تنفيذ #${row.number}`,
        body: dto.reason.trim().slice(0, 140),
        recipientUserIds: [row.assigneeUserId],
        excludeUserId: actorId,
      });
    }
    return updated;
  }

  async addAttachment(
    id: string,
    actorId: string,
    file: { filename: string; originalname: string; url: string },
    asSupervisor = false,
  ) {
    const row = await this.getRaw(id);
    const execStatuses = [
      'in_progress',
      'rework',
      'waiting_parts',
      'waiting_access',
    ];
    const allowed =
      (execStatuses.includes(row.status) && row.assigneeUserId === actorId) ||
      (row.status === 'done_field' && asSupervisor);
    if (!allowed) {
      throw new BadRequestException(
        'رفع الصور متاح للفني أثناء التنفيذ أو للمشرف أثناء المراجعة',
      );
    }

    const att = await this.prisma.workOrderAttachment.create({
      data: {
        workOrderId: id,
        uploadedById: actorId,
        url: file.url,
        originalName: file.originalname,
      },
    });
    await this.audit.log({
      actorId,
      action: 'attach',
      resource: 'maintenance.work_order',
      resourceId: id,
      metadata: { number: row.number, attachmentId: att.id },
    });
    return att;
  }

  private async supervisorRecipients(...extra: string[]) {
    const perm = await this.prismaCore.permission.findUnique({
      where: { code: PERMISSIONS.MAINTENANCE_SUPERVISE },
      include: {
        roles: {
          include: {
            role: { include: { users: { select: { userId: true } } } },
          },
        },
      },
    });
    const fromRoles =
      perm?.roles.flatMap((rp) => rp.role.users.map((u) => u.userId)) ?? [];
    return [...new Set([...fromRoles, ...extra.filter(Boolean)])];
  }

  async cancel(
    id: string,
    dto: ReasonDto,
    actorId: string,
    roles: TransitionRole[],
  ) {
    const row = await this.getRaw(id);
    const updated = await this.transition(row, 'cancelled', actorId, roles, {
      cancelReason: dto.reason.trim(),
      closedAt: new Date(),
    });
    if (row.requestId) {
      await this.requests.closeIfAllWorkOrdersDone(row.requestId, actorId);
    }
    return updated;
  }

  private async requireAssignee(
    id: string,
    actorId: string,
    allowSuperviseResume = false,
  ) {
    const row = await this.getRaw(id);
    if (row.assigneeUserId !== actorId && !allowSuperviseResume) {
      throw new BadRequestException('الإجراء متاح للفني المعيَّن فقط');
    }
    return row;
  }

  private async transition(
    row: Awaited<ReturnType<WorkOrdersService['getRaw']>>,
    to: WorkOrderStatus,
    actorId: string,
    roles: TransitionRole[],
    extra: Record<string, unknown> = {},
    reason?: string,
  ) {
    assertWorkOrderTransition(row.status, to, roles);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.statusEvent.create({
        data: {
          workOrderId: row.id,
          fromStatus: row.status,
          toStatus: to,
          actorId,
          reason: reason ?? null,
        },
      });
      return tx.workOrder.update({
        where: { id: row.id },
        data: { status: to, ...extra },
        include: INCLUDE,
      });
    });
    await this.audit.log({
      actorId,
      action: `status:${to}`,
      resource: 'maintenance.work_order',
      resourceId: row.id,
      metadata: { number: row.number, from: row.status, to },
    });
    return this.enrichOne(updated);
  }

  private async getRaw(id: string) {
    const row = await this.prisma.workOrder.findUnique({
      where: { id },
      include: INCLUDE,
    });
    if (!row) throw new NotFoundException('أمر العمل غير موجود');
    return row;
  }

  private async enrichMany(
    rows: Awaited<ReturnType<WorkOrdersService['getRaw']>>[],
  ) {
    const ids = rows.flatMap((r) => [
      r.createdByUserId,
      r.assigneeUserId,
      r.reviewedByUserId,
      ...r.statusEvents.map((e) => e.actorId),
      ...r.attachments.map((a) => a.uploadedById),
    ]);
    const users = await this.users.loadMap(
      ids.filter((x): x is string => Boolean(x)),
    );
    return rows.map((r) => ({
      ...r,
      createdBy: this.users.brief(users, r.createdByUserId),
      assignee: this.users.brief(users, r.assigneeUserId),
      reviewedBy: this.users.brief(users, r.reviewedByUserId),
      statusEvents: r.statusEvents.map((e) => ({
        ...e,
        actor: this.users.brief(users, e.actorId),
      })),
      attachments: r.attachments.map((a) => ({
        ...a,
        uploadedBy: this.users.brief(users, a.uploadedById),
      })),
    }));
  }

  private async enrichOne(
    row: Awaited<ReturnType<WorkOrdersService['getRaw']>>,
  ) {
    return (await this.enrichMany([row]))[0];
  }
}
