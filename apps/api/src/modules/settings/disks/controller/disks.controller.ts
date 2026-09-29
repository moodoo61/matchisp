import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../../common/guards';
import { MountDiskDto } from '../dto/mount-disk.dto';
import { UnmountDiskDto } from '../dto/unmount-disk.dto';
import { UpsertDiskNoteDto } from '../dto/upsert-disk-note.dto';
import { DisksInventoryService } from '../service/disks-inventory.service';
import { DisksMountService } from '../service/disks-mount.service';
import { DisksNotesService } from '../service/disks-notes.service';
import { DisksSmartService } from '../service/disks-smart.service';

@ApiTags('settings-disks')
@ApiBearerAuth()
@Controller('settings/disks')
export class DisksController {
  constructor(
    private readonly inventory: DisksInventoryService,
    private readonly mountSvc: DisksMountService,
    private readonly smartSvc: DisksSmartService,
    private readonly notes: DisksNotesService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SETTINGS_DISKS_READ)
  list() {
    return this.inventory.inventory();
  }

  @Get('smart')
  @RequirePermissions(PERMISSIONS.SETTINGS_DISKS_READ)
  smart(@Query('devicePath') devicePath: string) {
    return this.smartSvc.smart(devicePath ?? '');
  }

  @Post('mount')
  @RequirePermissions(PERMISSIONS.SETTINGS_DISKS_MOUNT)
  mount(@Body() dto: MountDiskDto, @CurrentUser() user: RequestUser) {
    return this.mountSvc.mount(dto, user.id);
  }

  @Post('unmount')
  @RequirePermissions(PERMISSIONS.SETTINGS_DISKS_UNMOUNT)
  unmount(@Body() dto: UnmountDiskDto, @CurrentUser() user: RequestUser) {
    return this.mountSvc.unmount(dto, user.id);
  }

  @Patch('notes')
  @RequirePermissions(PERMISSIONS.SETTINGS_DISKS_MANAGE)
  upsertNote(
    @Body() dto: UpsertDiskNoteDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.notes.upsert(dto, user.id);
  }
}
