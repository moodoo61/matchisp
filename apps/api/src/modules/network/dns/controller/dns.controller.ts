import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { RequirePermissions } from '../../../../common/guards';
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
}
