import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ViewingReportsSettingsService } from '../../viewing_reports/service/viewing-reports-settings.service';
import { MistJwtService } from './mist-jwt.service';
import { MistServerClient } from './mist-server.client';

const BOOT_ATTEMPTS = 5;
const BOOT_DELAY_MS = 2000;

/**
 * عند إقلاع النظام: يتحقق ويُضيف
 * - حماية: JWK + مشغّل USER_NEW
 * - تقارير: مشغّل USER_END
 */
@Injectable()
export class MistIntegrationBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(MistIntegrationBootstrapService.name);

  constructor(
    private readonly mist: MistServerClient,
    private readonly mistJwt: MistJwtService,
    private readonly viewingReports: ViewingReportsSettingsService,
  ) {}

  async onModuleInit() {
    if (!this.mist.enabled()) {
      this.logger.warn('MistServer معطّل — تخطي مزامنة التكامل عند الإقلاع');
      return;
    }
    void this.ensureWithRetries();
  }

  async ensureNow(): Promise<{
    mistOk: boolean;
    jwk: boolean;
    userNew: boolean;
    userEnd: boolean;
    detail: string;
  }> {
    const ping = await this.mist.ping();
    if (!ping.ok) {
      return {
        mistOk: false,
        jwk: false,
        userNew: false,
        userEnd: false,
        detail: ping.detail,
      };
    }

    const protectionOn = await this.mistJwt.isProtectionEnabled();
    const reportsOn = await this.viewingReports.isEnabled();

    if (protectionOn) {
      await this.mistJwt.ensureViewerProtection();
    }
    if (reportsOn) {
      await this.viewingReports.syncIfEnabled();
    }

    const status = await this.verifyStatus();
    this.logger.log(
      `تكامل Mist بعد المزامنة — حماية=${
        protectionOn
          ? `JWK=${status.jwk ? '✓' : '✗'} USER_NEW=${status.userNew ? '✓' : '✗'}`
          : 'معطّلة'
      } · تقارير=${
        reportsOn ? (status.userEnd ? 'USER_END✓' : 'USER_END✗') : 'معطّلة'
      }`,
    );
    return { mistOk: true, ...status };
  }

  private async ensureWithRetries() {
    for (let attempt = 1; attempt <= BOOT_ATTEMPTS; attempt++) {
      try {
        const result = await this.ensureNow();
        if (!result.mistOk) {
          this.logger.warn(
            `محاولة ${attempt}/${BOOT_ATTEMPTS}: Mist غير جاهز — ${result.detail}`,
          );
        } else {
          const protectionOn = await this.mistJwt.isProtectionEnabled();
          const reportsOn = await this.viewingReports.isEnabled();
          const okProtection =
            !protectionOn || (result.jwk && result.userNew);
          const okReports = !reportsOn || result.userEnd;
          if (okProtection && okReports) {
            this.logger.log(
              'تكامل Mist مكتمل عند الإقلاع (JWK + USER_NEW + USER_END حسب الإعدادات)',
            );
            return;
          }
          this.logger.warn(
            `محاولة ${attempt}/${BOOT_ATTEMPTS}: ناقص — JWK=${result.jwk} USER_NEW=${result.userNew} USER_END=${result.userEnd}`,
          );
        }
      } catch (err) {
        this.logger.warn(
          `محاولة ${attempt}/${BOOT_ATTEMPTS} فشلت: ${
            err instanceof Error ? err.message : err
          }`,
        );
      }
      if (attempt < BOOT_ATTEMPTS) {
        await sleep(BOOT_DELAY_MS);
      }
    }
    this.logger.error(
      'تعذر إكمال مزامنة تكامل Mist بعد عدة محاولات — راجع الإعدادات والاتصال',
    );
  }

  private async verifyStatus(): Promise<{
    jwk: boolean;
    userNew: boolean;
    userEnd: boolean;
    detail: string;
  }> {
    const [jwk, userNew, userEnd] = await Promise.all([
      this.mistJwt.verifyViewerJwkPresent(),
      this.mistJwt.verifyUserNewPresent(),
      this.viewingReports.verifyUserEndPresent(),
    ]);
    return {
      jwk,
      userNew,
      userEnd,
      detail: 'تم التحقق من Mist',
    };
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
