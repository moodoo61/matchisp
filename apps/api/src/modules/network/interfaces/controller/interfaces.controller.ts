import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../../common/guards';
import { AddAddressDto } from '../dto/add-address.dto';
import { SetInterfaceStateDto } from '../dto/set-interface-state.dto';
import { AddressesService } from '../service/addresses.service';
import { InterfacesControlService } from '../service/interfaces-control.service';
import { InterfacesInventoryService } from '../service/interfaces-inventory.service';

@ApiTags('network-interfaces')
@ApiBearerAuth()
@Controller('settings/network/interfaces')
export class InterfacesController {
  constructor(
    private readonly inventory: InterfacesInventoryService,
    private readonly control: InterfacesControlService,
    private readonly addresses: AddressesService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.NETWORK_INTERFACES_READ)
  list() {
    return this.inventory.list();
  }

  @Post('state')
  @RequirePermissions(PERMISSIONS.NETWORK_INTERFACES_MANAGE)
  setState(
    @Body() dto: SetInterfaceStateDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.control.setState(dto.ifName, dto.state, user.id);
  }

  @Post('addresses')
  @RequirePermissions(PERMISSIONS.NETWORK_INTERFACES_MANAGE)
  addAddress(@Body() dto: AddAddressDto, @CurrentUser() user: RequestUser) {
    return this.addresses.add(dto.ifName, dto.cidr, user.id);
  }

  @Post('addresses/delete')
  @RequirePermissions(PERMISSIONS.NETWORK_INTERFACES_MANAGE)
  removeAddress(
    @Body() dto: AddAddressDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.addresses.remove(dto.ifName, dto.cidr, user.id);
  }
}
