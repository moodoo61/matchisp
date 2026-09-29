import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { tmpdir } from 'os';
import { extname } from 'path';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../../common/guards';
import { BackupSectionDto } from '../dto/backup-section.dto';
import { RestoreBackupDto } from '../dto/restore-backup.dto';
import { DatabasesBackupService } from '../service/databases-backup.service';
import { DatabasesInventoryService } from '../service/databases-inventory.service';
import { DatabasesRestoreService } from '../service/databases-restore.service';

const uploadOptions = {
  storage: diskStorage({
    destination: tmpdir(),
    filename: (_req, file, cb) => {
      const stamp = Date.now();
      cb(null, `db-restore-${stamp}${extname(file.originalname) || '.dump'}`);
    },
  }),
  limits: { fileSize: 512 * 1024 * 1024 },
};

@ApiTags('settings-databases')
@ApiBearerAuth()
@Controller('settings/databases')
export class DatabasesController {
  constructor(
    private readonly inventory: DatabasesInventoryService,
    private readonly backups: DatabasesBackupService,
    private readonly restore: DatabasesRestoreService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SETTINGS_DATABASES_READ)
  list() {
    return this.inventory.list();
  }

  @Get('backups')
  @RequirePermissions(PERMISSIONS.SETTINGS_DATABASES_READ)
  listBackups(@Query('sectionKey') sectionKey?: string) {
    return this.backups.listBackups(sectionKey || undefined);
  }

  @Post('backup')
  @RequirePermissions(PERMISSIONS.SETTINGS_DATABASES_BACKUP)
  backup(@Body() dto: BackupSectionDto, @CurrentUser() user: RequestUser) {
    return this.backups.createBackup(dto.sectionKey, user.id);
  }

  @Post('restore')
  @RequirePermissions(PERMISSIONS.SETTINGS_DATABASES_RESTORE)
  restoreStored(
    @Body() dto: RestoreBackupDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.restore.restoreFromStored(
      dto.sectionKey,
      dto.filename,
      user.id,
    );
  }

  @Post('restore/upload')
  @RequirePermissions(PERMISSIONS.SETTINGS_DATABASES_RESTORE)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sectionKey: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['sectionKey', 'file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  restoreUpload(
    @Body('sectionKey') sectionKey: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    if (!file?.path) {
      throw new BadRequestException('الملف مطلوب');
    }
    return this.restore.restoreFromUpload(
      sectionKey,
      file.path,
      file.originalname || file.filename,
      user.id,
    );
  }

  @Get('backups/:sectionKey/:filename/download')
  @RequirePermissions(PERMISSIONS.SETTINGS_DATABASES_READ)
  async download(
    @Param('sectionKey') sectionKey: string,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, filename: name } = await this.backups.openDownload(
      sectionKey,
      filename,
    );
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${name}"`,
    });
    return new StreamableFile(stream);
  }

  @Delete('backups/:sectionKey/:filename')
  @RequirePermissions(PERMISSIONS.SETTINGS_DATABASES_MANAGE)
  remove(
    @Param('sectionKey') sectionKey: string,
    @Param('filename') filename: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.backups.deleteBackup(sectionKey, filename, user.id);
  }
}
