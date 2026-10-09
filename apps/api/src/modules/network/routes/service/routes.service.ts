import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { AuditService } from '../../../audit/audit.service';
import {
  IFACE_NAME_RE,
  IPV4_RE,
} from '../../constants/network-safety';
import { NmProfilesService } from '../../nm/service/nm-profiles.service';
import { NmcliService } from '../../nm/service/nmcli.service';
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

  constructor(
    private readonly audit: AuditService,
    private readonly profiles: NmProfilesService,
    private readonly nmcli: NmcliService,
  ) {}

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

    let applied: { device: string; connection: string };
    try {
      applied = await this.profiles.setDefaultGateway(gateway, device);
    } catch (err) {
      this.logger.warn(`nm route: ${this.nmcli.errMsg(err)}`);
      if (
        err instanceof BadRequestException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      throw new BadRequestException(
        `فشل ضبط المسار عبر NetworkManager: ${this.nmcli.errMsg(err)}`,
      );
    }

    await this.audit.log({
      actorId,
      action: 'route_set',
      resource: 'network.route',
      resourceId: 'default',
      metadata: {
        gateway,
        device: applied.device,
        connection: applied.connection,
        backend: 'network-manager',
      },
    });

    return {
      success: true,
      gateway,
      device: applied.device,
    };
  }

  private async readRoutes(): Promise<IpRouteJson[]> {
    try {
      const { stdout } = await execFileAsync('ip', ['-j', 'route'], {
        timeout: 10000,
        maxBuffer: 2 * 1024 * 1024,
      });
      return JSON.parse(stdout) as IpRouteJson[];
    } catch (err) {
      this.logger.warn(`ip route failed: ${this.nmcli.errMsg(err)}`);
      return [];
    }
  }
}
