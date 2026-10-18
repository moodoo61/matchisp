import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaMaintenanceService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { CreateWorkOrderCommentDto } from '../dto/create-work-order-comment.dto';
import { MaintenanceUsersService } from './maintenance-users.service';

@Injectable()
export class WorkOrderCommentsService {
  constructor(
    private readonly prisma: PrismaMaintenanceService,
    private readonly users: MaintenanceUsersService,
    private readonly audit: AuditService,
  ) {}

  private async assertWorkOrder(workOrderId: string) {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: {
        id: true,
        number: true,
        assigneeUserId: true,
        createdByUserId: true,
      },
    });
    if (!wo) throw new NotFoundException('أمر العمل غير موجود');
    return wo;
  }

  async list(workOrderId: string) {
    await this.assertWorkOrder(workOrderId);
    const rows = await this.prisma.workOrderComment.findMany({
      where: { workOrderId },
      orderBy: { createdAt: 'asc' },
    });
    return this.enrich(rows, workOrderId);
  }

  async create(
    workOrderId: string,
    dto: CreateWorkOrderCommentDto,
    actorId: string,
  ) {
    const wo = await this.assertWorkOrder(workOrderId);
    const body = dto.body.trim();
    if (!body) {
      throw new BadRequestException('نص التعليق مطلوب');
    }
    const row = await this.prisma.workOrderComment.create({
      data: {
        workOrderId,
        authorUserId: actorId,
        body,
      },
    });
    await this.audit.log({
      actorId,
      action: 'comment',
      resource: 'maintenance.work_order',
      resourceId: workOrderId,
      metadata: { number: wo.number, commentId: row.id },
    });
    const [enriched] = await this.enrich([row], workOrderId);
    return enriched;
  }

  private async enrich(
    rows: Array<{
      id: string;
      workOrderId: string;
      authorUserId: string;
      body: string;
      createdAt: Date;
    }>,
    workOrderId: string,
  ) {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { assigneeUserId: true, createdByUserId: true },
    });
    const users = await this.users.loadMap(rows.map((r) => r.authorUserId));
    return rows.map((r) => {
      const author = this.users.brief(users, r.authorUserId);
      let party = 'مشارك';
      if (r.authorUserId === wo?.assigneeUserId) party = 'الفني';
      else if (r.authorUserId === wo?.createdByUserId) party = 'المنشئ';
      return {
        id: r.id,
        workOrderId: r.workOrderId,
        body: r.body,
        createdAt: r.createdAt,
        author,
        party,
      };
    });
  }
}
