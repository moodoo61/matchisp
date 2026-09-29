import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/guards';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'isp-api',
      phase: 'A',
      timestamp: new Date().toISOString(),
    };
  }
}
