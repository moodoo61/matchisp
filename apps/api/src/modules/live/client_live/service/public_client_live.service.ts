import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaLiveService } from '../../../../database/database.module';
import { MistPlaybackService } from '../../service/mist/mist-playback.service';
import { MistServerService } from '../../service/mist/mist_server.service';
import { MistStreamWakeService } from '../../service/mist/mist-stream-wake.service';
import { ViewingChannelsService } from './viewing_channels.service';
import { ViewingPageService } from './viewing_page.service';

export type PublicLiveChannelDto = {
  id: string;
  name: string;
  label: string;
  type: 'IPTV' | 'HDMI';
  imageUrl: string | null;
  sortOrder: number;
  section: { id: string; name: string; label: string; sortOrder: number };
  online: 0 | 1 | 2 | null;
  active: boolean;
  viewers: number;
  playback: {
    hlsUrl: string;
    tsUrl: string;
    whepUrl: string;
    /** جودات TS من مسارات Mist — يُبنى الرابط بـ ?video=عرضxارتفاع */
    tsQualities: Array<{ width: number; height: number | null; label: string }>;
  };
};

export type PublicLiveSectionDto = {
  id: string;
  name: string;
  label: string;
  sortOrder: number;
  channels: PublicLiveChannelDto[];
};

/** جاهزية تشغيل قناة واحدة — للإيقاظ وانتظار الجودات بدون إعادة جلب كل الأقسام */
export type PublicChannelPlaybackReadyDto = {
  id: string;
  name: string;
  label: string;
  online: 0 | 1 | 2 | null;
  active: boolean;
  viewers: number;
  playback: PublicLiveChannelDto['playback'];
  /**
   * true عندما online=1 (أخضر Mist) وجودات TS جاهزة.
   * online: 1=active, 2=inactive — حسب توثيق MistServer.
   */
  tsReady: boolean;
  /** online === 1 — القناة نشطة (أخضر) */
  streamOnline: boolean;
};

/** قائمة قنوات البث للواجهة العامة (بدون بيانات أجهزة/مسارات داخلية) */
@Injectable()
export class PublicClientLiveService {
  constructor(
    private readonly prisma: PrismaLiveService,
    private readonly mist: MistServerService,
    private readonly playback: MistPlaybackService,
    private readonly wake: MistStreamWakeService,
    private readonly viewingPage: ViewingPageService,
    private readonly viewingChannels: ViewingChannelsService,
  ) {}

  async listChannels(): Promise<PublicLiveChannelDto[]> {
    const grouped = await this.listGrouped();
    return grouped.flatMap((section) => section.channels);
  }

  /**
   * يبدأ إيقاظ Mist بطلب رابط التشغيل الحقيقي، ثم يعيد حالة الجاهزية.
   * لا يغيّر المشغّل — فقط يفعّل الستريم وينتظر online=1 من جهة العميل.
   */
  async wakeChannel(channelId: string): Promise<PublicChannelPlaybackReadyDto> {
    const channel = await this.resolvePublicChannel(channelId);
    const settings = await this.viewingPage.getPublicSettings();
    this.wake.ensureWake(channel.name, {
      signed: settings.jwtPlaybackEnabled,
    });
    return this.buildPlaybackReady(channel, settings.jwtPlaybackEnabled);
  }

  async getChannelPlaybackReady(
    channelId: string,
  ): Promise<PublicChannelPlaybackReadyDto> {
    const channel = await this.resolvePublicChannel(channelId);
    const settings = await this.viewingPage.getPublicSettings();
    return this.buildPlaybackReady(channel, settings.jwtPlaybackEnabled);
  }

  private async resolvePublicChannel(channelId: string) {
    const settings = await this.viewingPage.getPublicSettings();
    if (!settings.enabled) {
      throw new NotFoundException('البث غير متاح حالياً');
    }

    const hidden = await this.viewingChannels.getHiddenIds();
    if (hidden.has(channelId)) {
      throw new NotFoundException('القناة غير متاحة');
    }

    const channel = await this.prisma.channel.findFirst({
      where: { id: channelId, isActive: true },
      select: { id: true, name: true, label: true },
    });
    if (!channel) {
      throw new NotFoundException('القناة غير موجودة');
    }
    return channel;
  }

  private async buildPlaybackReady(
    channel: { id: string; name: string; label: string },
    jwtSigned: boolean,
  ): Promise<PublicChannelPlaybackReadyDto> {
    const [mistStatuses, activeStats, tsQualities] = await Promise.all([
      this.mist.listStreamStatuses(),
      this.mist.listActiveStreamStats(),
      this.mist.listStreamTsQualities(),
    ]);

    const stats = activeStats.get(channel.name);
    const mist = this.mist.statusFor(
      channel.name,
      mistStatuses,
      stats?.viewers ?? 0,
    );
    const qualities = tsQualities.get(channel.name) ?? [];
    const urls = this.playback.urlsFor(channel.name, { signed: jwtSigned });
    const streamOnline = mist.online === 1;
    const qualitiesOk = qualities.some(
      (row) =>
        Number.isFinite(row.width) &&
        row.width > 0 &&
        row.height != null &&
        Number.isFinite(row.height) &&
        row.height > 0,
    );

    return {
      id: channel.id,
      name: channel.name,
      label: channel.label,
      online: mist.online,
      active: mist.active,
      viewers: mist.viewers,
      playback: {
        ...urls,
        tsQualities: qualities,
      },
      streamOnline,
      tsReady: streamOnline && qualitiesOk,
    };
  }

  async listGrouped(): Promise<PublicLiveSectionDto[]> {
    const settings = await this.viewingPage.getPublicSettings();
    if (!settings.enabled) return [];

    const [hidden, sections, mistStatuses, activeStats, tsQualities] =
      await Promise.all([
        this.viewingChannels.getHiddenIds(),
        this.prisma.channelSection.findMany({
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            channels: {
              where: { isActive: true },
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            },
          },
        }),
        this.mist.listStreamStatuses(),
        this.mist.listActiveStreamStats(),
        this.mist.listStreamTsQualities(),
      ]);

    return sections
      .map((section) => {
        const channels = section.channels
          .filter((channel) => !hidden.has(channel.id))
          .map((channel) => {
            const stats = activeStats.get(channel.name);
            const mist = this.mist.statusFor(
              channel.name,
              mistStatuses,
              stats?.viewers ?? 0,
            );
            const urls = this.playback.urlsFor(channel.name, {
              signed: settings.jwtPlaybackEnabled,
            });
            return {
              id: channel.id,
              name: channel.name,
              label: channel.label,
              type: channel.type,
              imageUrl: channel.imageUrl,
              sortOrder: channel.sortOrder,
              section: {
                id: section.id,
                name: section.name,
                label: section.label,
                sortOrder: section.sortOrder,
              },
              online: mist.online,
              active: mist.active,
              viewers: mist.viewers,
              playback: {
                ...urls,
                tsQualities: tsQualities.get(channel.name) ?? [],
              },
            };
          });
        return {
          id: section.id,
          name: section.name,
          label: section.label,
          sortOrder: section.sortOrder,
          channels,
        };
      })
      .filter((section) => section.channels.length > 0);
  }
}
