import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { LoginImageAdsService } from './service/login_image_ads.service';
import { LoginImageUploadService } from './service/login_image_upload.service';
import { LoginTextAdsService } from './service/login_text_ads.service';
import { LoginContactsService } from './service/login_contacts.service';
import { LoginPackagesService } from './service/login_packages.service';
import { LoginServicesService } from './service/login_services.service';
import { LoginServiceUploadService } from './service/login_service_upload.service';
import { PageCardFlagsService } from './service/page_card_flags.service';
import { StatusServicesService } from './service/status_services.service';
import { StatusServiceUploadService } from './service/status_service_upload.service';
import { MorePageSettingsService } from './service/more_page_settings.service';
import { MorePageItemsService } from './service/more_page_items.service';
import { MorePageAboutService } from './service/more_page_about.service';
import { MorePageStoryService } from './service/more_page_story.service';
import { MorePagePublicService } from './service/more_page_public.service';
import { MorePageUploadService } from './service/more_page_upload.service';
import { LoginImageAdsController } from './controllers/login_image_ads.controller';
import { LoginTextAdsController } from './controllers/login_text_ads.controller';
import { LoginContactsController } from './controllers/login_contacts.controller';
import { LoginPackagesController } from './controllers/login_packages.controller';
import { LoginServicesController } from './controllers/login_services.controller';
import { PageCardFlagsController } from './controllers/page_card_flags.controller';
import { PublicLoginContentController } from './controllers/public_login_content.controller';
import { StatusServicesController } from './controllers/status_services.controller';
import { PublicStatusContentController } from './controllers/public_status_content.controller';
import { MorePageSettingsController } from './controllers/more_page_settings.controller';
import { MorePageItemsController } from './controllers/more_page_items.controller';
import { MorePageAboutController } from './controllers/more_page_about.controller';
import { MorePageStoryController } from './controllers/more_page_story.controller';
import { PublicMoreContentController } from './controllers/public_more_content.controller';

@Module({
  imports: [AuditModule],
  controllers: [
    LoginImageAdsController,
    LoginTextAdsController,
    LoginContactsController,
    LoginPackagesController,
    LoginServicesController,
    PageCardFlagsController,
    PublicLoginContentController,
    StatusServicesController,
    PublicStatusContentController,
    MorePageSettingsController,
    MorePageItemsController,
    MorePageAboutController,
    MorePageStoryController,
    PublicMoreContentController,
  ],
  providers: [
    PageCardFlagsService,
    LoginImageAdsService,
    LoginImageUploadService,
    LoginTextAdsService,
    LoginContactsService,
    LoginPackagesService,
    LoginServicesService,
    LoginServiceUploadService,
    StatusServicesService,
    StatusServiceUploadService,
    MorePageSettingsService,
    MorePageItemsService,
    MorePageAboutService,
    MorePageStoryService,
    MorePagePublicService,
    MorePageUploadService,
  ],
})
export class PageManagementModule {}
