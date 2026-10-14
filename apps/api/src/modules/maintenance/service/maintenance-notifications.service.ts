import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaMaintenanceService } from '../../../database/database.module';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

@Injectable()
export class MaintenanceNotificationsService {
  constructor(
    private readonly prisma: PrismaMaintenanceService,
    private readonly realtime: RealtimeGateway,
  ) {}

  listForUser(userId: string, limit = 30) {
    return this.prisma.maintenanceNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.maintenanceNotification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markRead(id: string, userId: string) {
    const row = await this.prisma.maintenanceNotification.findFirst({
      where: { id, userId },
    });
    if (!row) throw new NotFoundException('الإشعار غير موجود');
    if (row.readAt) return row;
    return this.prisma.maintenanceNotification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.maintenanceNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async notify(input: {
    workOrderId: string;
    workOrderNumber: number;
    title: string;
    body: string;
    recipientUserIds: string[];
    excludeUserId?: string;
  }) {
    const recipients = [
      ...new Set(
        input.recipientUserIds.filter(
          (id) => id && id !== input.excludeUserId,
        ),
      ),
    ];
    if (!recipients.length) return;

    await this.prisma.maintenanceNotification.createMany({
      data: recipients.map((userId) => ({
        userId,
        workOrderId: input.workOrderId,
        title: input.title,
        body: input.body,
      })),
    });

    for (const userId of recipients) {
      this.realtime.emitToUser(userId, 'maintenance_notification', {
        title: input.title,
        body: input.body,
        workOrderId: input.workOrderId,
        workOrderNumber: input.workOrderNumber,
      });
    }
  }
}
