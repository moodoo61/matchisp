import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaLiveService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';
import { MistPlaybackService } from '../../service/mist/mist-playback.service';
import { MistServerService } from '../../service/mist/mist_server.service';
import {
  DEFAULT_VIEWING_CHANNELS_VISIBILITY,
  VIEWING_CHANNELS_META_KEY,
  type ViewingChannelsVisibility,
} from '../constants/viewing-channels';
import { UpdateViewingChannelVisibilityDto } from '../dto/update-viewing-channel-visibility.dto';
import { ViewingPageService } from './viewing_page.service';

export type ViewingPageChannelRow = {
  id: string;
  name: string;
  label: string;
  type: 'IPTV' | 'HDMI';
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  visible: boolean;
  section: { id: string; name: string; label: string; sortOrder: number };
  online: 0 | 1 | 2 | null;
  active: boolean;
  viewers: number;
  playback: { hlsUrl: string; tsUrl: string; whepUrl: string };
};

/** إدارة قنوات صفحة المشاهدة (الظهور + روابط التشغيل) */
@Injectable()
export class ViewingChannelsService {
  constructor(
    private readonly prisma: PrismaLiveService,
    private readonly mist: MistServerService,
    private readonly playback: MistPlaybackService,
    private readonly viewingPage: ViewingPageService,
    private readonly audit: AuditService,
  ) {}

  async listForAdmin(): Promise<{
    httpBase: string;
    sections: Array<{
      id: string;
      name: string;
      label: string;
      sortOrder: number;
      channels: ViewingPageChannelRow[];
    }>;
  }> {
    const [visibility, sections, mistStatuses, activeStats, pageSettings] =
      await Promise.all([
        this.loadVisibility(),
        this.prisma.channelSection.findMany({
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            channels: {
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            },
          },
        }),
        this.mist.listStreamStatuses(),
        this.mist.listActiveStreamStats(),
        this.viewingPage.getSettings(),
      ]);

    const hidden = new Set(visibility.hiddenChannelIds);
    const signed = pageSettings.jwtPlaybackEnabled;

    return {
      httpBase: this.playback.httpBase(),
      sections: sections.map((section) => ({
        id: section.id,
        name: section.name,
        label: section.label,
        sortOrder: section.sortOrder,
        channels: section.channels.map((channel) => {
          const stats = activeStats.get(channel.name);
          const mist = this.mist.statusFor(
            channel.name,
            mistStatuses,
            stats?.viewers ?? 0,
          );
          const urls = this.playback.urlsFor(channel.name, { signed });
          return {
            id: channel.id,
            name: channel.name,
            label: channel.label,
            type: channel.type,
            imageUrl: channel.imageUrl,
            sortOrder: channel.sortOrder,
            isActive: channel.isActive,
            visible: !hidden.has(channel.id),
            section: {
              id: section.id,
              name: section.name,
              label: section.label,
              sortOrder: section.sortOrder,
            },
            online: mist.online,
            active: mist.active,
            viewers: mist.viewers,
            playback: urls,
          };
        }),
      })),
    };
  }

  async setVisibility(
    channelId: string,
    dto: UpdateViewingChannelVisibilityDto,
    actorId: string,
  ) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { id: true, name: true, label: true },
    });
    if (!channel) {
      throw new NotFoundException('القناة غير موجودة');
    }

    const current = await this.loadVisibility();
    const hidden = new Set(current.hiddenChannelIds);
    if (dto.visible) hidden.delete(channel.id);
    else hidden.add(channel.id);

    const next: ViewingChannelsVisibility = {
      hiddenChannelIds: [...hidden],
    };

    await this.prisma.sectionMeta.upsert({
      where: { key: VIEWING_CHANNELS_META_KEY },
      create: {
        key: VIEWING_CHANNELS_META_KEY,
        value: JSON.stringify(next),
      },
      update: { value: JSON.stringify(next) },
    });

    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'live.viewing_page.channel',
      resourceId: channel.id,
      metadata: { visible: dto.visible, name: channel.name },
    });

    return {
      id: channel.id,
      visible: dto.visible,
      label: channel.label,
    };
  }

  async getHiddenIds(): Promise<Set<string>> {
    const visibility = await this.loadVisibility();
    return new Set(visibility.hiddenChannelIds);
  }

  private async loadVisibility(): Promise<ViewingChannelsVisibility> {
    const row = await this.prisma.sectionMeta.findUnique({
      where: { key: VIEWING_CHANNELS_META_KEY },
    });
    if (!row?.value) return { ...DEFAULT_VIEWING_CHANNELS_VISIBILITY };
    try {
      const parsed = JSON.parse(row.value) as Partial<ViewingChannelsVisibility>;
      const ids = Array.isArray(parsed.hiddenChannelIds)
        ? parsed.hiddenChannelIds.filter(
            (id): id is string => typeof id === 'string' && id.length > 0,
          )
        : [];
      return { hiddenChannelIds: ids };
    } catch {
      return { ...DEFAULT_VIEWING_CHANNELS_VISIBILITY };
    }
  }
}
