import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { ItemsService } from '../service/items.service';

@ApiTags('inventory-items')
@ApiBearerAuth()
@Controller('inventory/items')
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  list() {
    return this.items.list();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.items.get(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  create(@Body() dto: CreateItemDto, @CurrentUser() user: RequestUser) {
    return this.items.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.items.update(id, dto, user.id);
  }
}
