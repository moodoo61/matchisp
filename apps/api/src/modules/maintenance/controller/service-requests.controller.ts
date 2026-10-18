import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
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
import {
  WORK_PRIORITY_LABELS,
  WORK_PRIORITIES,
} from '../constants/priority';
import {
  WORK_ORDER_TYPE_LABELS,
  WORK_ORDER_TYPES,
} from '../constants/work-order-type';
import { ConvertServiceRequestDto } from '../dto/convert-service-request.dto';
import { CreateServiceRequestDto } from '../dto/create-service-request.dto';
import { RejectServiceRequestDto } from '../dto/reject-service-request.dto';
import { TriageServiceRequestDto } from '../dto/triage-service-request.dto';
import { rolesFromPermissions } from '../lib/transition-roles';
import {
  ServiceRequestAttachmentUploadService,
  serviceRequestAttachmentsMulterOptions,
} from '../service/service-request-attachment-upload.service';
import { ServiceRequestsService } from '../service/service-requests.service';

@ApiTags('maintenance-requests')
@ApiBearerAuth()
@Controller('maintenance/requests')
export class ServiceRequestsController {
  constructor(
    private readonly requests: ServiceRequestsService,
    private readonly uploads: ServiceRequestAttachmentUploadService,
  ) {}

  @Get('meta/types')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_READ)
  types() {
    return WORK_ORDER_TYPES.map((value) => ({
      value,
      label: WORK_ORDER_TYPE_LABELS[value],
    }));
  }

  @Get('meta/priorities')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_READ)
  priorities() {
    return WORK_PRIORITIES.map((value) => ({
      value,
      label: WORK_PRIORITY_LABELS[value],
    }));
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MAINTENANCE_READ)
  list() {
    return this.requests.list();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MAINTENANCE_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.requests.get(id);
  }

  @Post()
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_REQUEST_CREATE,
    PERMISSIONS.MAINTENANCE_TRIAGE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  create(
    @Body() dto: CreateServiceRequestDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.requests.create(
      dto,
      user.id,
      rolesFromPermissions(user.permissions),
    );
  }

  @Post(':id/submit')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_REQUEST_CREATE,
    PERMISSIONS.MAINTENANCE_TRIAGE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.requests.submit(id, user.id);
  }

  @Post(':id/triage')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_TRIAGE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  triage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TriageServiceRequestDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.requests.triage(id, dto, user.id);
  }

  @Post(':id/reject')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_TRIAGE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectServiceRequestDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.requests.reject(id, dto, user.id);
  }

  @Post(':id/convert')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_TRIAGE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  convert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertServiceRequestDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.requests.convert(
      id,
      dto,
      user.id,
      rolesFromPermissions(user.permissions),
    );
  }

  @Post(':id/attachments')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_REQUEST_CREATE,
    PERMISSIONS.MAINTENANCE_TRIAGE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', serviceRequestAttachmentsMulterOptions),
  )
  uploadAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    if (!file) throw new BadRequestException('الملف مطلوب');
    return this.requests.addAttachment(id, user.id, {
      originalname: file.originalname,
      url: this.uploads.toPublicUrl(file.filename),
    });
  }

  @Delete(':id')
  @RequireAnyPermission(
    PERMISSIONS.MAINTENANCE_DELETE,
    PERMISSIONS.MAINTENANCE_SUPERVISE,
  )
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.requests.remove(id, user.id);
  }
}
