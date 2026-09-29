import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaLiveService } from '../../../../database/database.module';
import { MistServerService } from '../mist/mist_server.service';

export type ChannelsOverview = {
  checkedAt: string;
  mistserver: {
    status: 'ok' | 'error';
    available: boolean;
    url: string;
    detail: string;
  };
  activeChannels: number;
  totalChannels: number;
  viewers: number;
};

@Injectable()
export class ChannelsOverviewService {
  constructor(
    private readonly prisma: PrismaLiveService,
    private readonly mist: MistServerService,
    private readonly config: ConfigService,
  ) {}

  async getOverview(): Promise<ChannelsOverview> {
    const url =
      this.config.get<string>('MISTSERVER_API_URL')?.trim() ||
      'http://127.0.0.1:4242/api2';

    const [channels, statuses, activeStats, ping] = await Promise.all([
      this.prisma.channel.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.mist.listStreamStatuses(),
      this.mist.listActiveStreamStats(),
      this.mist.ping(),
    ]);

    let activeChannels = 0;
    let viewers = 0;

    for (const channel of channels) {
      const status = statuses.get(channel.name);
      const stats = activeStats.get(channel.name);
      const isActive =
        status?.online === 1 ||
        status?.active === true ||
        (stats !== undefined && (stats.inputs > 0 || stats.clients > 0));
      if (isActive) activeChannels += 1;
      viewers += stats?.viewers ?? 0;
    }

    return {
      checkedAt: new Date().toISOString(),
      mistserver: {
        status: ping.ok ? 'ok' : 'error',
        available: ping.ok,
        url,
        detail: ping.detail,
      },
      activeChannels,
      totalChannels: channels.length,
      viewers,
    };
  }
}
