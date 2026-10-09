import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { execFile } from 'child_process';
import { readFile } from 'fs/promises';
import { promisify } from 'util';
import { AuditService } from '../../../audit/audit.service';
import {
  DNS_SEARCH_RE,
  IFACE_NAME_RE,
  IPV4_RE,
} from '../../constants/network-safety';
import { NmProfilesService } from '../../nm/service/nm-profiles.service';
import { NmcliService } from '../../nm/service/nmcli.service';
import type { NetworkDnsInfo } from '../../types/network.types';

const execFileAsync = promisify(execFile);

/** قراءة/ضبط DNS — الضبط الدائم عبر NetworkManager */
@Injectable()
export class DnsService {
  private readonly logger = new Logger(DnsService.name);

  constructor(
    private readonly audit: AuditService,
    private readonly profiles: NmProfilesService,
    private readonly nmcli: NmcliService,
  ) {}

  async get(): Promise<NetworkDnsInfo> {
    const resolvConf = await this.readResolv();
    const fromFile = this.parseResolv(resolvConf);
    const fromResolved = await this.readResolved();

    return {
      mode: fromResolved ? 'systemd-resolved' : 'resolv.conf',
      servers:
        fromResolved?.servers.length ? fromResolved.servers : fromFile.servers,
      search:
        fromResolved?.search.length ? fromResolved.search : fromFile.search,
      resolvConf,
    };
  }

  async set(
    servers: string[],
    search: string[] | undefined,
    device: string | undefined,
    actorId: string,
  ) {
    const cleanServers = unique(
      (servers ?? []).map((s) => s.trim()).filter(Boolean),
    );
    const cleanSearch = unique(
      (search ?? []).map((s) => s.trim().toLowerCase()).filter(Boolean),
    );

    for (const s of cleanServers) {
      if (!IPV4_RE.test(s) || !validIpv4Octets(s)) {
        throw new BadRequestException(`خادم DNS غير صالح: ${s}`);
      }
    }
    for (const s of cleanSearch) {
      if (!DNS_SEARCH_RE.test(s)) {
        throw new BadRequestException(`نطاق بحث غير صالح: ${s}`);
      }
    }
    if (device && !IFACE_NAME_RE.test(device)) {
      throw new BadRequestException('اسم المنفذ غير صالح');
    }

    let applied: { device: string; connection: string };
    try {
      applied = await this.profiles.setDns(
        cleanServers,
        cleanSearch,
        device,
      );
    } catch (err) {
      this.logger.warn(`nm dns: ${this.nmcli.errMsg(err)}`);
      if (
        err instanceof BadRequestException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      throw new BadRequestException(
        `فشل ضبط DNS عبر NetworkManager: ${this.nmcli.errMsg(err)}`,
      );
    }

    await this.audit.log({
      actorId,
      action: 'dns_set',
      resource: 'network.dns',
      resourceId: applied.device,
      metadata: {
        servers: cleanServers,
        search: cleanSearch,
        connection: applied.connection,
        backend: 'network-manager',
      },
    });

    return {
      success: true,
      device: applied.device,
      servers: cleanServers,
      search: cleanSearch,
    };
  }

  private async readResolv(): Promise<string> {
    try {
      return await readFile('/etc/resolv.conf', 'utf8');
    } catch {
      return '';
    }
  }

  private parseResolv(text: string): { servers: string[]; search: string[] } {
    const servers: string[] = [];
    const search: string[] = [];
    for (const line of text.split('\n')) {
      const t = line.trim();
      if (t.startsWith('nameserver ')) {
        servers.push(t.slice('nameserver '.length).trim());
      } else if (t.startsWith('search ') || t.startsWith('domain ')) {
        const parts = t.split(/\s+/).slice(1);
        search.push(...parts);
      }
    }
    return { servers, search };
  }

  private async readResolved(): Promise<{
    servers: string[];
    search: string[];
  } | null> {
    try {
      const { stdout } = await execFileAsync(
        'resolvectl',
        ['status'],
        { timeout: 8000, maxBuffer: 2 * 1024 * 1024 },
      );
      const servers: string[] = [];
      const search: string[] = [];
      for (const line of stdout.split('\n')) {
        const t = line.trim();
        if (t.startsWith('DNS Servers:')) {
          servers.push(
            ...t
              .slice('DNS Servers:'.length)
              .trim()
              .split(/\s+/)
              .filter(Boolean),
          );
        } else if (t.startsWith('DNS Domain:')) {
          search.push(
            ...t
              .slice('DNS Domain:'.length)
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .filter((x) => x !== '~.'),
          );
        } else if (/^\d{1,3}(\.\d{1,3}){3}$/.test(t) && servers.length) {
          servers.push(t);
        }
      }
      return { servers: [...new Set(servers)], search: [...new Set(search)] };
    } catch (err) {
      this.logger.debug(
        `resolvectl: ${err instanceof Error ? err.message : err}`,
      );
      return null;
    }
  }
}

function unique(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function validIpv4Octets(ip: string): boolean {
  return ip.split('.').map(Number).every((n) => n >= 0 && n <= 255);
}
