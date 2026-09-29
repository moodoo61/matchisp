import { Injectable } from '@nestjs/common';
import { PrismaCoreService } from '../../database/database.module';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaCoreService) {}

  async overview() {
    const [usersTotal, usersActive, rolesTotal, recentAudit] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { status: 'ACTIVE' } }),
        this.prisma.role.count(),
        this.prisma.auditLog.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: {
            actor: { select: { id: true, name: true, username: true } },
          },
        }),
      ]);

    return {
      stats: {
        usersTotal,
        usersActive,
        rolesTotal,
        auditToday: await this.prisma.auditLog.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      },
      recentAudit,
      sections: [
        { key: 'core', name: 'النواة', status: 'ready' },
        {
          key: 'network_pages',
          name: 'إدارة الصفحة',
          status: 'in_progress',
        },
        { key: 'live', name: 'البث المباشر', status: 'in_progress' },
        { key: 'magazine', name: 'المجلة', status: 'scaffolded' },
        { key: 'maintenance', name: 'الصيانة', status: 'scaffolded' },
      ],
    };
  }
}
