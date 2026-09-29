import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DatabasesController } from './databases/controller/databases.controller';
import { DatabasesBackupService } from './databases/service/databases-backup.service';
import { DatabasesCatalogService } from './databases/service/databases-catalog.service';
import { DatabasesInventoryService } from './databases/service/databases-inventory.service';
import { DatabasesRestoreService } from './databases/service/databases-restore.service';
import { DisksController } from './disks/controller/disks.controller';
import { DisksInventoryService } from './disks/service/disks-inventory.service';
import { DisksMountService } from './disks/service/disks-mount.service';
import { DisksNotesService } from './disks/service/disks-notes.service';
import { DisksSmartService } from './disks/service/disks-smart.service';

@Module({
  imports: [AuditModule],
  controllers: [DisksController, DatabasesController],
  providers: [
    DisksInventoryService,
    DisksMountService,
    DisksNotesService,
    DisksSmartService,
    DatabasesCatalogService,
    DatabasesBackupService,
    DatabasesRestoreService,
    DatabasesInventoryService,
  ],
})
export class SettingsModule {}
