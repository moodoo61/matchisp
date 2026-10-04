import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SettingsModule } from '../settings/settings.module';
import { ChannelSectionsController } from './controllers/channel_sections.controller';
import { ChannelsController } from './controllers/channels.controller';
import { HdmiDevicesController } from './controllers/hdmi_devices.controller';
import { EncodingStatusController } from './controllers/encoding_status.controller';
import { SourceProbeController } from './controllers/source_probe.controller';
import { ChannelSectionsService } from './service/channel-sections/channel_sections.service';
import { ChannelSectionUniquenessService } from './service/channel-sections/section-uniqueness';
import { ChannelsService } from './service/channels/channels.service';
import { ChannelsOverviewService } from './service/channels/channels-overview.service';
import { ChannelUploadService } from './service/channels/channel_upload.service';
import { ChannelUniquenessService } from './service/channels/channel-uniqueness';
import { HdmiDevicesService } from './service/hdmi/hdmi_devices.service';
import { EncodingStatusService } from './service/encoding/encoding-status.service';
import { HlsMasterProbeService } from './service/encoding/source-options/passthrough-ffmpeg/hls-master-probe.service';
import { HlsMasterPlaylistService } from './service/encoding/source-options/passthrough-ffmpeg/hls-master-playlist.service';
import { EncodingSettingsService } from './service/encoding/encoding-settings.service';
import { EncodingQualityService } from './service/encoding/quality/encoding-quality.service';
import { MistServerClient } from './service/mist/mist-server.client';
import { MistServerService } from './service/mist/mist_server.service';
import { PublicClientLiveController } from './client_live/controllers/public_client_live.controller';
import { ViewingChannelsController } from './client_live/controllers/viewing_channels.controller';
import { ViewingPageController } from './client_live/controllers/viewing_page.controller';
import { PublicClientLiveService } from './client_live/service/public_client_live.service';
import { ViewingChannelsService } from './client_live/service/viewing_channels.service';
import { ViewingPageService } from './client_live/service/viewing_page.service';
import { MistPlaybackService } from './service/mist/mist-playback.service';
import { SportTeamsController } from './sports_events/controllers/sport-teams.controller';
import { SportMatchesController } from './sports_events/controllers/sport-matches.controller';
import { SportsEventsSettingsController } from './sports_events/controllers/sports-events-settings.controller';
import { SportMatchChannelOptionsController } from './sports_events/controllers/sport-match-channel-options.controller';
import { PublicSportsEventsController } from './sports_events/controllers/public_sports_events.controller';
import { SportTeamsService } from './sports_events/service/sport-teams.service';
import { SportTeamUploadService } from './sports_events/service/sport-team-upload.service';
import { SportMatchesService } from './sports_events/service/sport-matches.service';
import { SportsEventsSettingsService } from './sports_events/service/sports-events-settings.service';
import { SportMatchesAutoClearService } from './sports_events/service/sport-matches-auto-clear.service';

@Module({
  imports: [AuditModule, SettingsModule],
  controllers: [
    ChannelSectionsController,
    ChannelsController,
    HdmiDevicesController,
    EncodingStatusController,
    SourceProbeController,
    ViewingPageController,
    ViewingChannelsController,
    PublicClientLiveController,
    SportTeamsController,
    SportMatchesController,
    SportsEventsSettingsController,
    SportMatchChannelOptionsController,
    PublicSportsEventsController,
  ],
  providers: [
    ChannelSectionsService,
    ChannelSectionUniquenessService,
    ChannelsService,
    ChannelsOverviewService,
    ChannelUploadService,
    ChannelUniquenessService,
    HdmiDevicesService,
    HlsMasterProbeService,
    HlsMasterPlaylistService,
    EncodingStatusService,
    EncodingSettingsService,
    EncodingQualityService,
    MistServerClient,
    MistServerService,
    MistPlaybackService,
    PublicClientLiveService,
    ViewingPageService,
    ViewingChannelsService,
    SportTeamsService,
    SportTeamUploadService,
    SportMatchesService,
    SportsEventsSettingsService,
    SportMatchesAutoClearService,
  ],
})
export class LiveModule {}
