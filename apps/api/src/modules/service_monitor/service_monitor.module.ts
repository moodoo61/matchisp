import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MonitoredServicesController } from './controller/monitored-services.controller';
import { MonitoredServicesService } from './service/monitored-services.service';
import { ServiceProbeService } from './service/service-probe.service';

@Module({
  imports: [AuditModule],
  controllers: [MonitoredServicesController],
  providers: [MonitoredServicesService, ServiceProbeService],
})
export class ServiceMonitorModule {}
