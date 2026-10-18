import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { RequirePermissions } from '../../../common/guards';
import { QueryCdrDto } from '../dto/query-cdr.dto';
import { CallsService } from '../service/calls.service';

@ApiTags('comms-calls')
@ApiBearerAuth()
@Controller('comms/calls')
export class CallsController {
  constructor(private readonly calls: CallsService) {}

  @Get('active')
  @RequirePermissions(PERMISSIONS.COMMS_READ)
  active() {
    return this.calls.listActive();
  }

  @Get('cdr')
  @RequirePermissions(PERMISSIONS.COMMS_READ)
  cdr(@Query() query: QueryCdrDto) {
    return this.calls.listCdr(query);
  }
}
