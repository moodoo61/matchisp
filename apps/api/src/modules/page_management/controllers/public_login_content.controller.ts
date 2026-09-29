import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginImageAdsService } from '../service/login_image_ads.service';
import { LoginTextAdsService } from '../service/login_text_ads.service';
import { LoginContactsService } from '../service/login_contacts.service';
import { LoginPackagesService } from '../service/login_packages.service';
import { LoginServicesService } from '../service/login_services.service';
import { Public } from '../../../common/guards';

/** نقاط نهاية عامة لصفحات العملاء (بوابة الشبكة) */
@ApiTags('public-login')
@Controller('public/login')
export class PublicLoginContentController {
  constructor(
    private readonly imageAds: LoginImageAdsService,
    private readonly textAds: LoginTextAdsService,
    private readonly contacts: LoginContactsService,
    private readonly packages: LoginPackagesService,
    private readonly services: LoginServicesService,
  ) {}

  @Public()
  @Get('ads')
  imageAdsPublic() {
    return this.imageAds.listPublic();
  }

  @Public()
  @Get('ticker')
  textAdsPublic() {
    return this.textAds.listPublic();
  }

  @Public()
  @Get('contacts')
  contactsPublic() {
    return this.contacts.listPublic();
  }

  @Public()
  @Get('packages')
  packagesPublic() {
    return this.packages.listPublic();
  }

  @Public()
  @Get('services')
  servicesPublic() {
    return this.services.listPublic();
  }
}
