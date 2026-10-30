import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AgentsController } from './controller/agents.controller';
import { AgentsMapsSettingsController } from './controller/agents-maps-settings.controller';
import { AgentsPublicApiSettingsController } from './controller/agents-public-api-settings.controller';
import { PublicAgentsController } from './controller/public-agents.controller';
import { RegionsController } from './controller/regions.controller';
import { AgentsService } from './service/agents.service';
import { AgentsMapsSettingsService } from './service/agents-maps-settings.service';
import { AgentsPublicApiSettingsService } from './service/agents-public-api-settings.service';
import { RegionsService } from './service/regions.service';

@Module({
  imports: [AuditModule],
  controllers: [
    AgentsPublicApiSettingsController,
    AgentsMapsSettingsController,
    AgentsController,
    RegionsController,
    PublicAgentsController,
  ],
  providers: [
    AgentsService,
    AgentsPublicApiSettingsService,
    AgentsMapsSettingsService,
    RegionsService,
  ],
})
export class PartnersModule {}
