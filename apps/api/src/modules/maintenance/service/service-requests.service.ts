import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaMaintenanceService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { computeSlaDates, type WorkPriority } from '../constants/priority';
import { ConvertServiceRequestDto } from '../dto/convert-service-request.dto';
import { CreateServiceRequestDto } from '../dto/create-service-request.dto';
import { RejectServiceRequestDto } from '../dto/reject-service-request.dto';
import { TriageServiceRequestDto } from '../dto/triage-service-request.dto';
import type { TransitionRole } from '../lib/assert-transition';
import { MaintenanceNotificationsService } from './maintenance-notifications.service';
import { MaintenanceUsersService } from './maintenance-users.service';

const INCLUDE = {
  asset: true,
  attachments: { orderBy: { createdAt: 'desc' as const } },
  workOrders: {
    select: {
      id: true,
      number: true,
      status: true,
      type: true,
      title: true,
    },
    orderBy: { number: 'desc' as const },
  },
};

@Injectable()
export class ServiceRequestsService {
  constructor(
    private readonly prisma: PrismaMaintenanceService,
    private readonly audit: AuditService,
    private readonly users: MaintenanceUsersService,
    private readonly notifications: MaintenanceNotificationsService,
  ) {}

  async list() {
    const rows = await this.prisma.serviceRequest.findMany({
      include: INCLUDE,
      orderBy: [{ createdAt: 'desc' }],
    });
    return this.enrichMany(rows);
  }

  async get(id: string) {
    const row = await this.getRaw(id);
    return this.enrichOne(row);
  }

  async create(
    dto: CreateServiceRequestDto,
    actorId: string,
    roles: TransitionRole[] = [],
  ) {
    if (dto.convertToWorkOrder) {
      if (!roles.includes('triage') && !roles.includes('supervise')) {
        throw new ForbiddenException(
          'التحويل لأمر عمل يتطلب صلاحية الفرز أو الإشراف',
        );
      }
    }
    if (dto.assigneeUserId && !dto.convertToWorkOrder) {
      throw new BadRequestException(
        'التعيين يتطلب تفعيل التحويل لأمر عمل',
      );
    }

    const submit = dto.submit !== false;
    const now = submit ? new Date() : null;
    const row = await this.prisma.serviceRequest.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() ?? '',
        workType: dto.workType,
        priority: dto.priority ?? 'p3',
        assetId: dto.assetId ?? null,
        locationText: dto.locationText?.trim() ?? '',
        reporterUserId: actorId,
        /** يُنشأ مفروزاً مباشرة — جاهز للتحويل دون خطوة فرز منفصلة */
        status: submit ? 'triaged' : 'draft',
        submittedAt: now,
      },
      include: INCLUDE,
    });
    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'maintenance.service_request',
      resourceId: row.id,
      metadata: { number: row.number, status: row.status },
    });

    if (dto.convertToWorkOrder && submit) {
      return this.convert(
        row.id,
        {
          approve: true,
          assigneeUserId: dto.assigneeUserId,
        },
        actorId,
        roles,
      );
    }

    return this.enrichOne(row);
  }

  async submit(id: string, actorId: string) {
    const row = await this.getRaw(id);
    if (row.status !== 'draft') {
      throw new BadRequestException('يمكن تقديم المسودات فقط');
    }
    const updated = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'triaged',
        submittedAt: new Date(),
      },
      include: INCLUDE,
    });
    await this.audit.log({
      actorId,
      action: 'submit',
      resource: 'maintenance.service_request',
      resourceId: id,
      metadata: { number: row.number, status: 'triaged' },
    });
    return this.enrichOne(updated);
  }

  async triage(id: string, dto: TriageServiceRequestDto, actorId: string) {
    const row = await this.getRaw(id);
    if (row.status !== 'submitted' && row.status !== 'triaged') {
      throw new BadRequestException('الفرز متاح للبلاغات المقدَّمة فقط');
    }
    const updated = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'triaged',
        workType: dto.workType ?? row.workType,
        priority: dto.priority ?? row.priority,
        assetId: dto.assetId === undefined ? row.assetId : dto.assetId,
        locationText:
          dto.locationText !== undefined
            ? dto.locationText.trim()
            : row.locationText,
        triageNotes: dto.triageNotes?.trim() ?? row.triageNotes,
      },
      include: INCLUDE,
    });
    await this.audit.log({
      actorId,
      action: 'triage',
      resource: 'maintenance.service_request',
      resourceId: id,
      metadata: { number: row.number },
    });
    return this.enrichOne(updated);
  }

  async reject(id: string, dto: RejectServiceRequestDto, actorId: string) {
    const row = await this.getRaw(id);
    if (row.status !== 'submitted' && row.status !== 'triaged') {
      throw new BadRequestException('لا يمكن رفض البلاغ في هذه الحالة');
    }
    const updated = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectReason: dto.reason.trim(),
        closedAt: new Date(),
      },
      include: INCLUDE,
    });
    await this.audit.log({
      actorId,
      action: 'reject',
      resource: 'maintenance.service_request',
      resourceId: id,
      metadata: { number: row.number, reason: dto.reason.trim() },
    });
    return this.enrichOne(updated);
  }

  /**
   * تحويل بلاغ إلى أمر عمل.
   * من submitted/triaged: أول أمر عمل → converted.
   * من converted: أمر عمل إضافي (مفيد للانقطاع متعدد الفرق).
   * اختياري: تطبيق حقول الفرز + تعيين فني في نفس العملية.
   */
  async convert(
    id: string,
    dto: ConvertServiceRequestDto,
    actorId: string,
    roles: TransitionRole[] = [],
  ) {
    const row = await this.getRaw(id);
    if (
      row.status !== 'submitted' &&
      row.status !== 'triaged' &&
      row.status !== 'converted'
    ) {
      throw new BadRequestException(
        'التحويل متاح بعد التقديم أو الفرز أو لبلاغ محوَّل',
      );
    }

    if (dto.assigneeUserId) {
      if (!roles.includes('dispatch') && !roles.includes('supervise')) {
        throw new ForbiddenException(
          'تعيين الفني يتطلب صلاحية التوزيع أو الإشراف',
        );
      }
      if (dto.approve === false) {
        throw new BadRequestException(
          'لا يمكن التعيين مع أمر عمل غير معتمد — أزل approve=false',
        );
      }
    }

    const approve = dto.approve !== false;
    const workType = dto.workType ?? row.workType;
    const priority = (dto.priority ?? row.priority) as WorkPriority;
    const assetId =
      dto.assetId !== undefined ? dto.assetId || null : row.assetId;
    const locationText =
      dto.locationText !== undefined
        ? dto.locationText.trim()
        : row.locationText;
    const triageNotes =
      dto.triageNotes !== undefined
        ? dto.triageNotes.trim()
        : row.triageNotes;
    const description = (dto.description ?? row.description).trim();
    const sla = approve ? computeSlaDates(priority) : {};
    const titleBase = (dto.title ?? row.title).trim();
    const title =
      row.status === 'converted' && !dto.title
        ? `${titleBase} (${row.workOrders.length + 1})`
        : titleBase;

    const applyTriageFields =
      row.status === 'submitted' || row.status === 'triaged';

    const result = await this.prisma.$transaction(async (tx) => {
      if (applyTriageFields) {
        await tx.serviceRequest.update({
          where: { id },
          data: {
            workType,
            priority,
            assetId,
            locationText,
            triageNotes,
            status: 'triaged',
          },
        });
      }

      let woStatus: string = approve ? 'approved' : 'draft';
      const wo = await tx.workOrder.create({
        data: {
          type: workType,
          priority,
          status: woStatus,
          title,
          description,
          requestId: row.id,
          assetId,
          locationText,
          createdByUserId: actorId,
          ...sla,
        },
      });

      const requestAttachments = await tx.serviceRequestAttachment.findMany({
        where: { serviceRequestId: id },
        orderBy: { createdAt: 'asc' },
      });
      if (requestAttachments.length) {
        await tx.workOrderAttachment.createMany({
          data: requestAttachments.map((a) => ({
            workOrderId: wo.id,
            uploadedById: a.uploadedById,
            url: a.url,
            originalName: a.originalName,
          })),
        });
      }

      if (approve) {
        await tx.statusEvent.create({
          data: {
            workOrderId: wo.id,
            fromStatus: 'draft',
            toStatus: 'approved',
            actorId,
            reason: 'اعتماد عند التحويل من بلاغ',
          },
        });
      }

      if (dto.assigneeUserId) {
        await tx.statusEvent.create({
          data: {
            workOrderId: wo.id,
            fromStatus: 'approved',
            toStatus: 'assigned',
            actorId,
            reason: 'تعيين عند التحويل من بلاغ',
          },
        });
        await tx.workOrder.update({
          where: { id: wo.id },
          data: {
            status: 'assigned',
            assigneeUserId: dto.assigneeUserId,
          },
        });
        woStatus = 'assigned';
      }

      const request = await tx.serviceRequest.update({
        where: { id },
        data: {
          status: 'converted',
          closedAt: null,
          ...(applyTriageFields
            ? { workType, priority, assetId, locationText, triageNotes }
            : {}),
        },
        include: INCLUDE,
      });
      return {
        request,
        workOrderId: wo.id,
        workOrderNumber: wo.number,
        workOrderTitle: title,
        assigned: Boolean(dto.assigneeUserId),
        assigneeUserId: dto.assigneeUserId ?? null,
        woStatus,
      };
    });

    await this.audit.log({
      actorId,
      action: 'convert',
      resource: 'maintenance.service_request',
      resourceId: id,
      metadata: {
        number: row.number,
        workOrderId: result.workOrderId,
        assigned: result.assigned,
        assigneeUserId: result.assigneeUserId,
      },
    });

    if (result.assigneeUserId) {
      await this.notifications.notify({
        workOrderId: result.workOrderId,
        workOrderNumber: result.workOrderNumber,
        title: `تعيين أمر عمل #${result.workOrderNumber}`,
        body: result.workOrderTitle,
        recipientUserIds: [result.assigneeUserId],
        excludeUserId: actorId,
      });
    }

    return this.enrichOne(result.request);
  }

  async addAttachment(
    id: string,
    actorId: string,
    file: { originalname: string; url: string },
  ) {
    await this.getRaw(id);
    const att = await this.prisma.serviceRequestAttachment.create({
      data: {
        serviceRequestId: id,
        uploadedById: actorId,
        url: file.url,
        originalName: file.originalname,
      },
    });
    await this.audit.log({
      actorId,
      action: 'attach',
      resource: 'maintenance.service_request',
      resourceId: id,
      metadata: { attachmentId: att.id, name: att.originalName },
    });
    const users = await this.users.loadMap([actorId]);
    return {
      id: att.id,
      url: att.url,
      originalName: att.originalName,
      createdAt: att.createdAt,
      uploadedBy: this.users.brief(users, actorId),
    };
  }

  /**
   * حذف البلاغ وكل أوامر العمل المرتبطة (ومرفقاتها/سجلاتها بالـ cascade).
   */
  async remove(id: string, actorId: string) {
    const row = await this.getRaw(id);
    const woIds = row.workOrders.map((w) => w.id);

    await this.prisma.$transaction(async (tx) => {
      if (woIds.length) {
        await tx.workOrder.deleteMany({ where: { id: { in: woIds } } });
      }
      await tx.serviceRequest.delete({ where: { id } });
    });

    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'maintenance.service_request',
      resourceId: id,
      metadata: {
        number: row.number,
        title: row.title,
        deletedWorkOrders: woIds.length,
        workOrderNumbers: row.workOrders.map((w) => w.number),
      },
    });

    return { success: true, deletedWorkOrders: woIds.length };
  }

  /** يغلق البلاغ إذا أُغلقت/أُلغيت كل أوامر العمل المرتبطة */
  async closeIfAllWorkOrdersDone(requestId: string, actorId: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { workOrders: { select: { status: true } } },
    });
    if (!request || request.status !== 'converted') return null;
    if (!request.workOrders.length) return null;

    const allDone = request.workOrders.every(
      (w) => w.status === 'closed' || w.status === 'cancelled',
    );
    if (!allDone) return null;

    const updated = await this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: 'closed', closedAt: new Date() },
      include: INCLUDE,
    });
    await this.audit.log({
      actorId,
      action: 'close',
      resource: 'maintenance.service_request',
      resourceId: requestId,
      metadata: {
        number: request.number,
        reason: 'أُغلقت كل أوامر العمل المرتبطة',
      },
    });
    return this.enrichOne(updated);
  }

  private async getRaw(id: string) {
    const row = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: INCLUDE,
    });
    if (!row) throw new NotFoundException('البلاغ غير موجود');
    return row;
  }

  private async enrichMany(
    rows: Awaited<ReturnType<ServiceRequestsService['getRaw']>>[],
  ) {
    const users = await this.users.loadMap([
      ...rows.map((r) => r.reporterUserId),
      ...rows.flatMap((r) => r.attachments.map((a) => a.uploadedById)),
    ]);
    return rows.map((r) => ({
      ...r,
      reporter: this.users.brief(users, r.reporterUserId),
      attachments: r.attachments.map((a) => ({
        id: a.id,
        url: a.url,
        originalName: a.originalName,
        createdAt: a.createdAt,
        uploadedBy: this.users.brief(users, a.uploadedById),
      })),
    }));
  }

  private async enrichOne(
    row: Awaited<ReturnType<ServiceRequestsService['getRaw']>>,
  ) {
    return (await this.enrichMany([row]))[0];
  }
}
