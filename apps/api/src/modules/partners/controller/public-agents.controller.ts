import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/guards';
import { AgentsService } from '../service/agents.service';

/** نقطة عامة لنقاط المبيعات / الوكلاء — متوافقة مع سكربت العميل */
@ApiTags('public-login-agents')
@Controller('public/login/agents')
export class PublicAgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Public()
  @Get()
  list() {
    return this.agents.listPublic();
  }
}
