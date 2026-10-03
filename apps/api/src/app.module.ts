import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { FailedRequestLoggingFilter } from './common/failed-request-logging.filter';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { TeamModule } from './modules/team/team.module';
import { RolesModule } from './modules/roles/roles.module';
import { AuditModule } from './modules/audit/audit.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { QueueModule } from './modules/queue/queue.module';
import { PageManagementModule } from './modules/page_management/page_management.module';
import { LiveModule } from './modules/live/live.module';
import { PartnersModule } from './modules/partners/partners.module';
import { ServiceMonitorModule } from './modules/service_monitor/service_monitor.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NetworkModule } from './modules/network/network.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    DatabaseModule,
    QueueModule,
    RealtimeModule,
    AuthModule,
    TeamModule,
    RolesModule,
    AuditModule,
    DashboardModule,
    HealthModule,
    PageManagementModule,
    LiveModule,
    PartnersModule,
    ServiceMonitorModule,
    SettingsModule,
    NetworkModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: FailedRequestLoggingFilter,
    },
  ],
})
export class AppModule {}
