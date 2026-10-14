import { Injectable } from '@nestjs/common';
import { PrismaMaintenanceService } from '../../../database/database.module';

@Injectable()
export class MaintenanceMetricsService {
  constructor(private readonly prisma: PrismaMaintenanceService) {}

  async summary() {
    const now = new Date();

    const [
      openRequests,
      activeWorkOrders,
      pendingReview,
      waitingParts,
      overdue,
      closedSample,
    ] = await Promise.all([
      this.prisma.serviceRequest.count({
        where: { status: { in: ['submitted', 'triaged', 'converted'] } },
      }),
      this.prisma.workOrder.count({
        where: {
          status: {
            in: [
              'approved',
              'assigned',
              'accepted',
              'in_progress',
              'waiting_parts',
              'waiting_access',
              'rework',
            ],
          },
        },
      }),
      this.prisma.workOrder.count({ where: { status: 'done_field' } }),
      this.prisma.workOrder.count({ where: { status: 'waiting_parts' } }),
      this.prisma.workOrder.count({
        where: {
          status: {
            notIn: ['closed', 'cancelled', 'draft'],
          },
          resolveBy: { lt: now },
        },
      }),
      this.prisma.workOrder.findMany({
        where: {
          status: 'closed',
          startedAt: { not: null },
          fieldFinishedAt: { not: null },
        },
        select: { startedAt: true, fieldFinishedAt: true },
        orderBy: { closedAt: 'desc' },
        take: 100,
      }),
    ]);

    let avgRepairHours: number | null = null;
    if (closedSample.length) {
      const totalMs = closedSample.reduce((sum, row) => {
        const start = row.startedAt!.getTime();
        const end = row.fieldFinishedAt!.getTime();
        return sum + Math.max(0, end - start);
      }, 0);
      avgRepairHours =
        Math.round((totalMs / closedSample.length / 3600_000) * 10) / 10;
    }

    return {
      openRequests,
      activeWorkOrders,
      pendingReview,
      waitingParts,
      overdue,
      avgRepairHours,
      sampleSize: closedSample.length,
    };
  }
}
