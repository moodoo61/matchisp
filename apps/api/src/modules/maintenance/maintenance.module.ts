import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AssetsController } from './controller/assets.controller';
import { MaintenanceMetricsController } from './controller/maintenance-metrics.controller';
import { MaintenanceNotificationsController } from './controller/maintenance-notifications.controller';
import { PartsRequestsController } from './controller/parts-requests.controller';
import { ServiceRequestsController } from './controller/service-requests.controller';
import { WorkOrdersController } from './controller/work-orders.controller';
import { AssetsService } from './service/assets.service';
import { MaintenanceMetricsService } from './service/maintenance-metrics.service';
import { MaintenanceNotificationsService } from './service/maintenance-notifications.service';
import { MaintenanceUsersService } from './service/maintenance-users.service';
import { PartsRequestsService } from './service/parts-requests.service';
import { ServiceRequestAttachmentUploadService } from './service/service-request-attachment-upload.service';
import { ServiceRequestsService } from './service/service-requests.service';
import { WorkOrderAttachmentUploadService } from './service/work-order-attachment-upload.service';
import { WorkOrderCommentsService } from './service/work-order-comments.service';
import { WorkOrdersService } from './service/work-orders.service';

@Module({
  imports: [AuditModule, RealtimeModule],
  controllers: [
    AssetsController,
    ServiceRequestsController,
    WorkOrdersController,
    PartsRequestsController,
    MaintenanceNotificationsController,
    MaintenanceMetricsController,
  ],
  providers: [
    AssetsService,
    MaintenanceUsersService,
    ServiceRequestsService,
    WorkOrdersService,
    WorkOrderCommentsService,
    PartsRequestsService,
    ServiceRequestAttachmentUploadService,
    WorkOrderAttachmentUploadService,
    MaintenanceNotificationsService,
    MaintenanceMetricsService,
  ],
})
export class MaintenanceModule {}
