import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@isp/shared';
import { RequirePermissions } from '../../../../common/guards';
import { PrismaLiveService } from '../../../../database/database.module';

/** خيارات القنوات لنموذج المباراة — بصلاحية الأحداث الرياضية فقط */
@ApiTags('live-sports-events-matches')
@ApiBearerAuth()
@Controller('live/sports-events/channel-options')
export class SportMatchChannelOptionsController {
  constructor(private readonly prisma: PrismaLiveService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.LIVE_SPORTS_EVENTS_READ)
  list() {
    return this.prisma.channel.findMany({
      where: { isActive: true },
      select: { id: true, name: true, label: true },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
  }
}
