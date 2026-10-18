import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../../../generated/comms';
import { PrismaCommsService } from '../../../database/database.module';
import { AsteriskStatusService } from '../asterisk/asterisk-status.service';
import { QueryCdrDto } from '../dto/query-cdr.dto';

export type ActiveCallDto = {
  channel: string;
  callerIdNum: string;
  callerIdName: string;
  connectedLineNum: string;
  connectedLineName: string;
  state: string;
  application: string;
  duration: string;
  bridgeId: string;
};

export type CdrItemDto = {
  uniqueid: string;
  calldate: string;
  src: string;
  dst: string;
  clid: string;
  disposition: string;
  duration: number;
  billsec: number;
  channel: string;
  dstchannel: string;
  lastapp: string;
};

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(
    private readonly prisma: PrismaCommsService,
    private readonly status: AsteriskStatusService,
  ) {}

  async listActive(): Promise<ActiveCallDto[]> {
    try {
      const ami = this.status.createClient();
      const channels = await ami.coreShowChannels();
      return channels.map((ch) => ({
        channel: ch.Channel || '',
        callerIdNum: ch.CallerIDNum || '',
        callerIdName: ch.CallerIDName || '',
        connectedLineNum: ch.ConnectedLineNum || '',
        connectedLineName: ch.ConnectedLineName || '',
        state: ch.ChannelStateDesc || ch.ChannelState || '',
        application: ch.Application || '',
        duration: ch.Duration || '',
        bridgeId: ch.BridgeId || '',
      }));
    } catch (err) {
      this.logger.warn(
        `فشل جلب المكالمات الجارية: ${err instanceof Error ? err.message : err}`,
      );
      return [];
    }
  }

  async listCdr(query: QueryCdrDto): Promise<CdrItemDto[]> {
    const limit = query.limit ?? 50;
    const where: Prisma.CallRecordWhereInput = {};

    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { src: { contains: q } },
        { dst: { contains: q } },
        { clid: { contains: q } },
      ];
    }
    if (query.from || query.to) {
      where.calldate = {};
      if (query.from) {
        const from = new Date(query.from);
        if (!Number.isNaN(from.getTime())) where.calldate.gte = from;
      }
      if (query.to) {
        const to = new Date(query.to);
        if (!Number.isNaN(to.getTime())) where.calldate.lte = to;
      }
    }

    const rows = await this.prisma.callRecord.findMany({
      where,
      orderBy: { calldate: 'desc' },
      take: limit,
    });

    return rows.map((r) => ({
      uniqueid: r.uniqueid,
      calldate: r.calldate.toISOString(),
      src: r.src,
      dst: r.dst,
      clid: r.clid,
      disposition: r.disposition,
      duration: r.duration,
      billsec: r.billsec,
      channel: r.channel,
      dstchannel: r.dstchannel,
      lastapp: r.lastapp,
    }));
  }
}
