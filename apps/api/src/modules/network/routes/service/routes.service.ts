import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { AuditService } from '../../../audit/audit.service';
import {
  IFACE_NAME_RE,
  IPV4_RE,
} from '../../constants/network-safety';
import type { NetworkRoute } from '../../types/network.types';

const execFileAsync = promisify(execFile);

type IpRouteJson = {
  dst?: string;
  gateway?: string;
  dev?: string;
  protocol?: string;
  metric?: number;
  scope?: string;
};

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(private readonly audit: AuditService) {}

  async list(): Promise<{ checkedAt: string; routes: NetworkRoute[] }> {
    const raw = await this.readRoutes();
    const routes = raw.map((r) => ({
      destination: r.dst ?? 'default',
      gateway: r.gateway ?? null,
      device: r.dev ?? null,
      protocol: r.protocol ?? null,
      metric: typeof r.metric === 'number' ? r.metric : null,
      scope: r.scope ?? null,
    }));
    return { checkedAt: new Date().toISOString(), routes };
  }

  async addDefault(
    gateway: string,
    device: string | undefined,
    actorId: string,
  ) {
    if (!IPV4_RE.test(gateway.trim())) {
      throw new BadRequestException('البوابة غير صالحة');
    }
    if (device && !IFACE_NAME_RE.test(device)) {
      throw new BadRequestException('اسم المنفذ غير صالح');
    }
    const args = ['route', 'replace', 'default', 'via', gateway.trim()];
    if (device?.trim()) {
      args.push('dev', device.trim());
    }
    try {
      await execFileAsync('ip', args, {
        timeout: 15000,
        maxBuffer: 1024 * 1024,
      });
    } catch (err) {
      this.logger.warn(`ip route: ${this.msg(err)}`);
      throw new BadRequestException(`فشل ضبط المسار: ${this.msg(err)}`);
    }

    await this.audit.log({
      actorId,
      action: 'route_set',
      resource: 'network.route',
      resourceId: 'default',
      metadata: { gateway, device: device ?? null },
    });

    return { success: true, gateway, device: device ?? null };
  }

  private async readRoutes(): Promise<IpRouteJson[]> {
    try {
      const { stdout } = await execFileAsync('ip', ['-j', 'route'], {
        timeout: 10000,
        maxBuffer: 2 * 1024 * 1024,
      });
      return JSON.parse(stdout) as IpRouteJson[];
    } catch (err) {
      this.logger.warn(`ip route failed: ${this.msg(err)}`);
      return [];
    }
  }

  private msg(err: unknown): string {
    if (!err || typeof err !== 'object') return String(err);
    const e = err as { stderr?: Buffer | string; message?: string };
    const stderr =
      typeof e.stderr === 'string'
        ? e.stderr
        : Buffer.isBuffer(e.stderr)
          ? e.stderr.toString('utf8')
          : '';
    return (stderr || e.message || String(err)).trim().slice(0, 400);
  }
}
