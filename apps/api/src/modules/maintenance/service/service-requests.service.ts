import {
  BadRequestException,
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
import { MaintenanceUsersService } from './maintenance-users.service';

const INCLUDE = {
  asset: true,
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

  async create(dto: CreateServiceRequestDto, actorId: string) {
    const submit = dto.submit !== false;
    const row = await this.prisma.serviceRequest.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() ?? '',
        workType: dto.workType,
        priority: dto.priority ?? 'p3',
        assetId: dto.assetId ?? null,
        locationText: dto.locationText?.trim() ?? '',
        reporterUserId: actorId,
        status: submit ? 'submitted' : 'draft',
        submittedAt: submit ? new Date() : null,
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
    return this.enrichOne(row);
  }

  async submit(id: string, actorId: string) {
    const row = await this.getRaw(id);
    if (row.status !== 'draft') {
      throw new BadRequestException('يمكن تقديم المسودات فقط');
    }
    const updated = await this.prisma.serviceRequest.update({
      where: { id },
      data: { status: 'submitted', submittedAt: new Date() },
      include: INCLUDE,
    });
    await this.audit.log({
      actorId,
      action: 'submit',
      resource: 'maintenance.service_request',
      resourceId: id,
      metadata: { number: row.number },
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
   */
  async convert(
    id: string,
    dto: ConvertServiceRequestDto,
    actorId: string,
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

    const approve = dto.approve !== false;
    const priority = row.priority as WorkPriority;
    const sla = approve ? computeSlaDates(priority) : {};
    const titleBase = (dto.title ?? row.title).trim();
    const title =
      row.status === 'converted' && !dto.title
        ? `${titleBase} (${row.workOrders.length + 1})`
        : titleBase;

    const result = await this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.create({
        data: {
          type: row.workType,
          priority: row.priority,
          status: approve ? 'approved' : 'draft',
          title,
          description: (dto.description ?? row.description).trim(),
          requestId: row.id,
          assetId: row.assetId,
          locationText: row.locationText,
          createdByUserId: actorId,
          ...sla,
        },
      });
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
      const request = await tx.serviceRequest.update({
        where: { id },
        data: {
          status: 'converted',
          closedAt: null,
        },
        include: INCLUDE,
      });
      return { request, workOrderId: wo.id };
    });

    await this.audit.log({
      actorId,
      action: 'convert',
      resource: 'maintenance.service_request',
      resourceId: id,
      metadata: {
        number: row.number,
        workOrderId: result.workOrderId,
      },
    });

    return this.enrichOne(result.request);
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
    const users = await this.users.loadMap(
      rows.map((r) => r.reporterUserId),
    );
    return rows.map((r) => ({
      ...r,
      reporter: this.users.brief(users, r.reporterUserId),
    }));
  }

  private async enrichOne(
    row: Awaited<ReturnType<ServiceRequestsService['getRaw']>>,
  ) {
    return (await this.enrichMany([row]))[0];
  }
}
