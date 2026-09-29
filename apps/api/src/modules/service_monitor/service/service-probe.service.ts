import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ServiceProbeResult } from '../types/service-probe';
import { MonitoredServicesService } from './monitored-services.service';

/** فحص اتصال HTTP بسيط لعنوان الخدمة */
async function probeHttp(
  url: string,
  timeoutMs = 4000,
): Promise<{ ok: boolean; statusCode: number | null; detail: string; latencyMs: number }> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
    });
    const latencyMs = Date.now() - started;
    return {
      ok: res.ok || (res.status >= 200 && res.status < 500),
      statusCode: res.status,
      detail: `HTTP ${res.status}`,
      latencyMs,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: null,
      detail: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - started,
    };
  } finally {
    clearTimeout(timer);
  }
}

@Injectable()
export class ServiceProbeService {
  constructor(
    private readonly services: MonitoredServicesService,
    private readonly config: ConfigService,
  ) {}

  private defaultUrl(key: string): string {
    if (key === 'mistserver') {
      return (
        this.config.get<string>('MISTSERVER_API_URL')?.trim() ||
        'http://127.0.0.1:4242/api2'
      );
    }
    if (key === 'librenms') {
      return (
        this.config.get<string>('LIBRENMS_URL')?.trim() ||
        'http://127.0.0.1:8000'
      );
    }
    if (key === 'asterisk') {
      return (
        this.config.get<string>('ASTERISK_AMI_URL')?.trim() ||
        'http://127.0.0.1:8088'
      );
    }
    return '';
  }

  async probe(key: string): Promise<ServiceProbeResult> {
    const row = await this.services.getByKey(key);
    const checkedAt = new Date().toISOString();

    if (!row.isEnabled) {
      return {
        key: row.key,
        checkedAt,
        status: 'missing',
        available: false,
        url: row.baseUrl || this.defaultUrl(row.key) || null,
        detail: 'المتابعة معطّلة لهذه الخدمة',
        latencyMs: null,
      };
    }

    const url = (row.baseUrl.trim() || this.defaultUrl(row.key)).trim();
    if (!url) {
      return {
        key: row.key,
        checkedAt,
        status: 'missing',
        available: false,
        url: null,
        detail: 'لم يُضبط عنوان الخدمة بعد',
        latencyMs: null,
      };
    }

    const result = await probeHttp(url);
    if (result.ok) {
      return {
        key: row.key,
        checkedAt,
        status: 'ok',
        available: true,
        url,
        detail: result.detail,
        latencyMs: result.latencyMs,
      };
    }

    return {
      key: row.key,
      checkedAt,
      status: 'error',
      available: false,
      url,
      detail: result.detail,
      latencyMs: result.latencyMs,
    };
  }
}
