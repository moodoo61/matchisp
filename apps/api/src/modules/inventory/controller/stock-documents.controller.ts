import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { StockDocumentsService } from '../service/stock-documents.service';

@ApiTags('inventory-documents')
@ApiBearerAuth()
@Controller('inventory/documents')
export class StockDocumentsController {
  constructor(private readonly documents: StockDocumentsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  list(@Query('type') type?: string) {
    return this.documents.list(type);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.documents.get(id);
  }

  @Post()
  @RequireAnyPermission(
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.INVENTORY_RECEIVE,
    PERMISSIONS.INVENTORY_ISSUE,
  )
  create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.documents.create(dto, user.id);
  }

  @Post(':id/post')
  @RequireAnyPermission(
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.INVENTORY_RECEIVE,
    PERMISSIONS.INVENTORY_ISSUE,
  )
  post(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.documents.post(id, user.id);
  }

  @Post(':id/cancel')
  @RequireAnyPermission(
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.INVENTORY_RECEIVE,
    PERMISSIONS.INVENTORY_ISSUE,
  )
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.documents.cancel(id, user.id);
  }
}
