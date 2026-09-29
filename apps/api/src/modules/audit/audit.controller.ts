import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { AuditService } from './audit.service';
import { RequirePermissions } from '../../common/guards';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.AUDIT_READ)
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('resource') resource?: string,
    @Query('action') action?: string,
  ) {
    return this.audit.list({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      resource,
      action,
    });
  }
}
