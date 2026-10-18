import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AsteriskConfigService } from './asterisk/asterisk-config.service';
import { AsteriskStatusService } from './asterisk/asterisk-status.service';
import { AsteriskStatusController } from './controller/asterisk-status.controller';
import { CallsController } from './controller/calls.controller';
import { ExtensionsController } from './controller/extensions.controller';
import { CallsService } from './service/calls.service';
import { ExtensionsService } from './service/extensions.service';

@Module({
  imports: [AuditModule],
  controllers: [
    AsteriskStatusController,
    ExtensionsController,
    CallsController,
  ],
  providers: [
    AsteriskStatusService,
    AsteriskConfigService,
    ExtensionsService,
    CallsService,
  ],
})
export class CommsModule {}
