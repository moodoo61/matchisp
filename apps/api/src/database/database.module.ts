import { Global, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient as CoreClient } from '../../generated/core';
import { PrismaClient as NetworkPagesClient } from '../../generated/network_pages';
import { PrismaClient as LiveClient } from '../../generated/live';
import { PrismaClient as BreakClient } from '../../generated/break';
import { PrismaClient as CommsClient } from '../../generated/comms';
import { PrismaClient as MagazineClient } from '../../generated/magazine';
import { PrismaClient as MaintenanceClient } from '../../generated/maintenance';
import { PrismaClient as PartnersClient } from '../../generated/partners';
import { PrismaClient as InventoryClient } from '../../generated/inventory';
import { PrismaClient as OrdersClient } from '../../generated/orders';
import { PrismaClient as SupportClient } from '../../generated/support';
import { PrismaClient as ExpensesClient } from '../../generated/expenses';
import { PrismaClient as PlatformClient } from '../../generated/platform';
import { PrismaClient as ServiceMonitorClient } from '../../generated/service_monitor';
import { PrismaClient as SettingsClient } from '../../generated/settings';
import { PrismaClient as NetworkClient } from '../../generated/network';

export class PrismaCoreService extends CoreClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export class PrismaNetworkPagesService
  extends NetworkPagesClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export class PrismaLiveService extends LiveClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export class PrismaBreakService extends BreakClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export class PrismaCommsService extends CommsClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export class PrismaMagazineService
  extends MagazineClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export class PrismaMaintenanceService
  extends MaintenanceClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export class PrismaPartnersService
  extends PartnersClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export class PrismaInventoryService
  extends InventoryClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export class PrismaOrdersService extends OrdersClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export class PrismaSupportService extends SupportClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export class PrismaExpensesService
  extends ExpensesClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export class PrismaPlatformService
  extends PlatformClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export class PrismaServiceMonitorService
  extends ServiceMonitorClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export class PrismaSettingsService
  extends SettingsClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export class PrismaNetworkService
  extends NetworkClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

@Global()
@Module({
  providers: [
    PrismaCoreService,
    PrismaNetworkPagesService,
    PrismaLiveService,
    PrismaBreakService,
    PrismaCommsService,
    PrismaMagazineService,
    PrismaMaintenanceService,
    PrismaPartnersService,
    PrismaInventoryService,
    PrismaOrdersService,
    PrismaSupportService,
    PrismaExpensesService,
    PrismaPlatformService,
    PrismaServiceMonitorService,
    PrismaSettingsService,
    PrismaNetworkService,
  ],
  exports: [
    PrismaCoreService,
    PrismaNetworkPagesService,
    PrismaLiveService,
    PrismaBreakService,
    PrismaCommsService,
    PrismaMagazineService,
    PrismaMaintenanceService,
    PrismaPartnersService,
    PrismaInventoryService,
    PrismaOrdersService,
    PrismaSupportService,
    PrismaExpensesService,
    PrismaPlatformService,
    PrismaServiceMonitorService,
    PrismaSettingsService,
    PrismaNetworkService,
  ],
})
export class DatabaseModule {}
