import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { LoginImageAdsService } from '../service/login_image_ads.service';
import { LoginTextAdsService } from '../service/login_text_ads.service';
import { LoginContactsService } from '../service/login_contacts.service';
import { LoginPackagesService } from '../service/login_packages.service';
import { LoginServicesService } from '../service/login_services.service';
import { LoginSecurityService } from '../service/login_security.service';
import { LoginFeaturesService } from '../service/login_features.service';
import { LoginBrandService } from '../service/login_brand.service';
import { LoginExternalAuthService } from '../service/login_external_auth.service';
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
    private readonly security: LoginSecurityService,
    private readonly features: LoginFeaturesService,
    private readonly brand: LoginBrandService,
    private readonly externalAuth: LoginExternalAuthService,
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

  /** إعدادات Hot Blocker لصفحة الدخول (عدد المحاولات + مدة الحظر) */
  @Public()
  @Get('security')
  securityPublic() {
    return this.security.getPublic();
  }

  /** مميزات الخلفية في صفحة الدخول */
  @Public()
  @Get('features')
  featuresPublic() {
    return this.features.listPublic();
  }

  /** اسم وشعار العلامة لصفحات الهوتسبوت */
  @Public()
  @Get('brand')
  brandPublic() {
    return this.brand.getPublic();
  }

  /** مصادقة خارجية — الدخول كمشترك */
  @Public()
  @Get('external-auth')
  externalAuthPublic() {
    return this.externalAuth.getPublic();
  }

  /**
   * تحقق مشترك عبر User Manager REST ثم إعادة POST لـ link-login على الراوتر
   * يستقبل application/x-www-form-urlencoded من صفحة الهوتسبوت
   */
  @Public()
  @Post('external-auth/login')
  @HttpCode(200)
  @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
  @Header('Cache-Control', 'no-store')
  async externalAuthLogin(
    @Body() body: Record<string, string>,
    @Res() res: Response,
  ) {
    try {
      const html = await this.externalAuth.loginAndBuildReturnHtml({
        username: String(body.username ?? ''),
        password: String(body.password ?? ''),
        linkLogin: String(body['link-login'] ?? body.linkLogin ?? ''),
        linkOrig: String(body['link-orig'] ?? body.linkOrig ?? ''),
        mac: body.mac ? String(body.mac) : undefined,
        ip: body.ip ? String(body.ip) : undefined,
      });
      res.type('html').send(html);
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        res
          .status(401)
          .type('html')
          .send(
            `<!DOCTYPE html><html lang="ar" dir="rtl"><body><p>بيانات الدخول غير صحيحة.</p><p><a href="javascript:history.back()">رجوع</a></p></body></html>`,
          );
        return;
      }
      const msg =
        err instanceof Error ? err.message : 'تعذر إتمام المصادقة الخارجية';
      res
        .status(400)
        .type('html')
        .send(
          `<!DOCTYPE html><html lang="ar" dir="rtl"><body><p>${msg}</p><p><a href="javascript:history.back()">رجوع</a></p></body></html>`,
        );
    }
  }
}
