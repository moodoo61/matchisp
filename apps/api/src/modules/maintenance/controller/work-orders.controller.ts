import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';
import { AssignWorkOrderDto } from '../dto/assign-work-order.dto';
import { CloseWorkOrderDto } from '../dto/close-work-order.dto';
import { FinishFieldDto } from '../dto/finish-field.dto';
import { QueryHistoryDto } from '../dto/query-history.dto';
import { ReasonDto } from '../dto/reason.dto';
import { rolesFromPermissions } from '../lib/transition-roles';
import { MaintenanceUsersService } from '../service/maintenance-users.service';
import {
  WorkOrderAttachmentUploadService,
  workOrderAttachmentsMulterOptions,
} from '../service/work-order-attachment-upload.service';
import { WorkOrdersService } from '../service/work-orders.service';

@ApiTags('maintenance-work-orders')
@ApiBearerAuth()
@Controller('maintenance/work-orders')
export class WorkOrdersController {
  constructor(
    private readonly workOrders: WorkOrdersService,
    private readonly users: MaintenanceUsersService,
    private readonly uploads: WorkOrderAttachmentUploadService,
  ) {}

  @Get('meta/members')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_READ)
  members() {
    return this.users.listMembers();
  }

  @Get('mine')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_EXECUTE)
  mine(@CurrentUser() user: RequestUser) {
    return this.workOrders.listMine(user.id);
  }

  @Get('pending-review')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_SUPERVISE)
  pendingReview() {
    return this.workOrders.listPendingReview();
  }

  @Get('pending-review/count')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_SUPERVISE)
  pendingReviewCount() {
    return this.workOrders.countPendingReview();
  }

  @Get('history')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_READ)
  history(@Query() query: QueryHistoryDto) {
    return this.workOrders.listHistory(query);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MAINTENANCE_READ)
  list() {
    return this.workOrders.list();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrders.get(id);
  }

  @Post(':id/approve')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_TRIAGE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workOrders.approve(
      id,
      user.id,
      rolesFromPermissions(user.permissions),
    );
  }

  @Post(':id/assign')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_DISPATCH,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignWorkOrderDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workOrders.assign(
      id,
      dto,
      user.id,
      rolesFromPermissions(user.permissions),
    );
  }

  @Post(':id/accept')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_EXECUTE)
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workOrders.accept(
      id,
      user.id,
      rolesFromPermissions(user.permissions),
    );
  }

  @Post(':id/reject-assignment')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_EXECUTE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  rejectAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReasonDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workOrders.rejectAssignment(
      id,
      dto,
      user.id,
      rolesFromPermissions(user.permissions),
    );
  }

  @Post(':id/start')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_EXECUTE)
  start(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workOrders.start(
      id,
      user.id,
      rolesFromPermissions(user.permissions),
    );
  }

  @Post(':id/wait-parts')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_EXECUTE)
  waitParts(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workOrders.waitParts(
      id,
      user.id,
      rolesFromPermissions(user.permissions),
    );
  }

  @Post(':id/wait-access')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_EXECUTE)
  waitAccess(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workOrders.waitAccess(
      id,
      user.id,
      rolesFromPermissions(user.permissions),
    );
  }

  @Post(':id/resume')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_EXECUTE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  resume(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workOrders.resume(
      id,
      user.id,
      rolesFromPermissions(user.permissions),
    );
  }

  @Post(':id/finish-field')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_EXECUTE)
  finishField(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FinishFieldDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workOrders.finishField(
      id,
      dto,
      user.id,
      rolesFromPermissions(user.permissions),
    );
  }

  @Post(':id/close')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_SUPERVISE)
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseWorkOrderDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workOrders.close(
      id,
      dto,
      user.id,
      rolesFromPermissions(user.permissions),
    );
  }

  @Post(':id/rework')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_SUPERVISE)
  rework(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReasonDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workOrders.rework(
      id,
      dto,
      user.id,
      rolesFromPermissions(user.permissions),
    );
  }

  @Post(':id/cancel')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_TRIAGE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReasonDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workOrders.cancel(
      id,
      dto,
      user.id,
      rolesFromPermissions(user.permissions),
    );
  }

  @Post(':id/attachments')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_EXECUTE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', workOrderAttachmentsMulterOptions))
  uploadAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    if (!file) throw new BadRequestException('الملف مطلوب');
    const asSupervisor = user.permissions.includes(
      PERMISSIONS.MAINTENANCE_SUPERVISE,
    );
    return this.workOrders.addAttachment(
      id,
      user.id,
      {
        filename: file.filename,
        originalname: file.originalname,
        url: this.uploads.toPublicUrl(file.filename),
      },
      asSupervisor,
    );
  }
}
