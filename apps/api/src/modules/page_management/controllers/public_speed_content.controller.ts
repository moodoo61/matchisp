import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SpeedOptionsService } from '../service/speed_options.service';
import { Public } from '../../../common/guards';

/** خيارات السرعة العامة لصفحات الهوتسبوت */
@ApiTags('public-speed')
@Controller('public/speed')
export class PublicSpeedContentController {
  constructor(private readonly speeds: SpeedOptionsService) {}

  @Public()
  @Get()
  list() {
    return this.speeds.listPublic();
  }
}
