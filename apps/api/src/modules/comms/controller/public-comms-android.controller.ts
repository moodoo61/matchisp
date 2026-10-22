import {
  Controller,
  Get,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createReadStream } from 'fs';
import { Public } from '../../../common/guards';
import { CommsAndroidApkService } from '../service/comms-android-apk.service';
import { CommsDiscoverySettingsService } from '../service/comms-discovery-settings.service';

@ApiTags('public-comms')
@Controller('public/comms')
export class PublicCommsAndroidController {
  constructor(
    private readonly settings: CommsDiscoverySettingsService,
    private readonly apk: CommsAndroidApkService,
  ) {}

  @Public()
  @Get('android-app')
  info() {
    return this.settings.getPublicDownloadInfo();
  }

  @Public()
  @Get('android-app/download')
  download(): StreamableFile {
    if (!this.apk.isAvailable()) {
      throw new NotFoundException('ملف التطبيق غير متوفر على الخادم');
    }
    const stream = createReadStream(this.apk.resolveApkPath());
    return new StreamableFile(stream, {
      type: 'application/vnd.android.package-archive',
      disposition: `attachment; filename="${this.apk.fileName()}"`,
    });
  }
}
