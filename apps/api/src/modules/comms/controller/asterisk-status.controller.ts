import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { RequirePermissions } from '../../../common/guards';
import { AsteriskStatusService } from '../asterisk/asterisk-status.service';

@ApiTags('comms-asterisk')
@ApiBearerAuth()
@Controller('comms/asterisk')
export class AsteriskStatusController {
  constructor(private readonly status: AsteriskStatusService) {}

  @Get('status')
  @RequirePermissions(PERMISSIONS.COMMS_READ)
  getStatus() {
    return this.status.getStatus();
  }
}
