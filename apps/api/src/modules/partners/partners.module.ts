import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AgentsController } from './controller/agents.controller';
import { AgentsPublicApiSettingsController } from './controller/agents-public-api-settings.controller';
import { PublicAgentsController } from './controller/public-agents.controller';
import { AgentsService } from './service/agents.service';
import { AgentsPublicApiSettingsService } from './service/agents-public-api-settings.service';

@Module({
  imports: [AuditModule],
  controllers: [
    AgentsPublicApiSettingsController,
    AgentsController,
    PublicAgentsController,
  ],
  providers: [AgentsService, AgentsPublicApiSettingsService],
})
export class PartnersModule {}
