import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../common/guards';
import { SportMatchesService } from '../service/sport-matches.service';

/** نقاط عامة لجدول مباريات اليوم (صفحة المشاهدة) */
@ApiTags('public-live-sports-events')
@Controller('public/live/sports-events')
export class PublicSportsEventsController {
  constructor(private readonly matches: SportMatchesService) {}

  @Public()
  @Get('matches/today')
  listToday() {
    return this.matches.listTodayPublic();
  }
}
