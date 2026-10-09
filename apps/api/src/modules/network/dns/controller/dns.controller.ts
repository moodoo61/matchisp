import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import {
  CurrentUser,
  RequirePermissions,
  type RequestUser,
} from '../../../../common/guards';
import { SetDnsDto } from '../dto/set-dns.dto';
import { DnsService } from '../service/dns.service';

@ApiTags('network-dns')
@ApiBearerAuth()
@Controller('settings/network/dns')
export class DnsController {
  constructor(private readonly dns: DnsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.NETWORK_DNS_READ)
  get() {
    return this.dns.get();
  }

  @Post()
  @RequirePermissions(PERMISSIONS.NETWORK_DNS_MANAGE)
  set(@Body() dto: SetDnsDto, @CurrentUser() user: RequestUser) {
    return this.dns.set(dto.servers, dto.search, dto.device, user.id);
  }
}
