import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AsteriskConfigService } from './asterisk/asterisk-config.service';
import { AsteriskStatusService } from './asterisk/asterisk-status.service';
import { AsteriskStatusController } from './controller/asterisk-status.controller';
import { CallsController } from './controller/calls.controller';
import { CommsDiscoverySettingsController } from './controller/comms-discovery-settings.controller';
import { PublicCommsAndroidController } from './controller/public-comms-android.controller';
import { ExtensionsController } from './controller/extensions.controller';
import { CallsService } from './service/calls.service';
import { CommsAndroidApkService } from './service/comms-android-apk.service';
import { CommsDiscoveryBeaconService } from './service/comms-discovery-beacon.service';
import { CommsDiscoverySettingsService } from './service/comms-discovery-settings.service';
import { ExtensionsService } from './service/extensions.service';

@Module({
  imports: [AuditModule],
  controllers: [
    AsteriskStatusController,
    ExtensionsController,
    CallsController,
    CommsDiscoverySettingsController,
    PublicCommsAndroidController,
  ],
  providers: [
    AsteriskStatusService,
    AsteriskConfigService,
    ExtensionsService,
    CallsService,
    CommsDiscoveryBeaconService,
    CommsAndroidApkService,
    CommsDiscoverySettingsService,
  ],
})
export class CommsModule {}
