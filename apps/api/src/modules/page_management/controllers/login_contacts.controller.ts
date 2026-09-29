import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { LoginContactsService } from '../service/login_contacts.service';
import { CreateContactMethodDto } from '../dto/create-contact-method.dto';
import { UpdateContactMethodDto } from '../dto/update-contact-method.dto';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../common/guards';

@ApiTags('page-management-login-contacts')
@ApiBearerAuth()
@Controller('pages/login/contacts')
export class LoginContactsController {
  constructor(private readonly contacts: LoginContactsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_CONTACTS_READ)
  list() {
    return this.contacts.listAdmin();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_CONTACTS_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.contacts.get(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_CONTACTS_MANAGE)
  create(
    @Body() dto: CreateContactMethodDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.contacts.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_CONTACTS_MANAGE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactMethodDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.contacts.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PAGE_LOGIN_CONTACTS_MANAGE)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.contacts.remove(id, user.id);
  }
}
