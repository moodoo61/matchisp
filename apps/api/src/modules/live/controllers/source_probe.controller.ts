import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { RequireAnyPermission } from '../../../common/guards';
import { ProbeHlsDto } from '../dto/probe-hls.dto';
import { HlsMasterProbeService } from '../service/encoding/source-options/passthrough-ffmpeg/hls-master-probe.service';

/** تحليل روابط HLS لخيار مباشر ffmpeg */
@ApiTags('live-source-probe')
@ApiBearerAuth()
@Controller('live/source')
export class SourceProbeController {
  constructor(private readonly probe: HlsMasterProbeService) {}

  @Post('hls-probe')
  @RequireAnyPermission(
    PERMISSIONS.LIVE_CHANNELS_CREATE,
    PERMISSIONS.LIVE_CHANNELS_UPDATE,
  )
  probeHls(@Body() dto: ProbeHlsDto) {
    return this.probe.probe(dto.url);
  }
}
