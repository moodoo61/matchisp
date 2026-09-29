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
import { LoginImageAdsController } from './controllers/login_image_ads.controller';
import { LoginTextAdsController } from './controllers/login_text_ads.controller';
import { LoginContactsController } from './controllers/login_contacts.controller';
import { LoginPackagesController } from './controllers/login_packages.controller';
import { LoginServicesController } from './controllers/login_services.controller';
import { PageCardFlagsController } from './controllers/page_card_flags.controller';
import { PublicLoginContentController } from './controllers/public_login_content.controller';
import { StatusServicesController } from './controllers/status_services.controller';
import { PublicStatusContentController } from './controllers/public_status_content.controller';

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
  ],
})
export class PageManagementModule {}
