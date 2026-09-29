import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaServiceMonitorService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import {
  isMonitoredServiceKey,
  type MonitoredServiceKey,
} from '../constants/monitored-service-keys';
import { UpdateMonitoredServiceDto } from '../dto/update-monitored-service.dto';

@Injectable()
export class MonitoredServicesService {
  constructor(
    private readonly prisma: PrismaServiceMonitorService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.monitoredService.findMany({
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  async getByKey(key: string) {
    if (!isMonitoredServiceKey(key)) {
      throw new NotFoundException('الخدمة غير معروفة');
    }
    const row = await this.prisma.monitoredService.findUnique({
      where: { key },
    });
    if (!row) throw new NotFoundException('الخدمة غير موجودة');
    return row;
  }

  async updateByKey(
    key: string,
    dto: UpdateMonitoredServiceDto,
    actorId: string,
  ) {
    const current = await this.getByKey(key);

    const updated = await this.prisma.monitoredService.update({
      where: { key: current.key },
      data: {
        ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.baseUrl !== undefined
          ? { baseUrl: dto.baseUrl.trim() }
          : {}),
        ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes.trim() } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });

    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'service_monitor.service',
      resourceId: updated.id,
      metadata: {
        key: updated.key as MonitoredServiceKey,
        baseUrl: updated.baseUrl,
        isEnabled: updated.isEnabled,
      },
    });

    return updated;
  }
}
