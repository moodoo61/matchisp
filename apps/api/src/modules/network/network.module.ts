import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DnsController } from './dns/controller/dns.controller';
import { DnsService } from './dns/service/dns.service';
import { InterfacesController } from './interfaces/controller/interfaces.controller';
import { AddressesService } from './interfaces/service/addresses.service';
import { InterfacesAdoptService } from './interfaces/service/interfaces-adopt.service';
import { InterfacesControlService } from './interfaces/service/interfaces-control.service';
import { InterfacesInventoryService } from './interfaces/service/interfaces-inventory.service';
import { NmManagedConfService } from './nm/service/nm-managed-conf.service';
import { NmProfilesService } from './nm/service/nm-profiles.service';
import { NmcliService } from './nm/service/nmcli.service';
import { RoutesController } from './routes/controller/routes.controller';
import { RoutesService } from './routes/service/routes.service';
import { SstpController } from './sstp/controller/sstp.controller';
import { SstpConnectionService } from './sstp/service/sstp-connection.service';
import { SstpSettingsService } from './sstp/service/sstp-settings.service';

@Module({
  imports: [AuditModule],
  controllers: [
    InterfacesController,
    RoutesController,
    DnsController,
    SstpController,
  ],
  providers: [
    NmcliService,
    NmManagedConfService,
    NmProfilesService,
    InterfacesInventoryService,
    InterfacesControlService,
    InterfacesAdoptService,
    AddressesService,
    RoutesService,
    DnsService,
    SstpSettingsService,
    SstpConnectionService,
  ],
})
export class NetworkModule {}
