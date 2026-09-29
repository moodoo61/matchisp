import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StatusServicesService } from '../service/status_services.service';
import { Public } from '../../../common/guards';

/** نقاط نهاية عامة لصفحة الحالة */
@ApiTags('public-status')
@Controller('public/status')
export class PublicStatusContentController {
  constructor(private readonly services: StatusServicesService) {}

  @Public()
  @Get('services')
  servicesPublic() {
    return this.services.listPublic();
  }
}
