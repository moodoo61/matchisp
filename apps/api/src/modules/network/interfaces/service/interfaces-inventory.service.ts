import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { PrismaNetworkService } from '../../../../database/database.module';
import { PROTECTED_IFACES } from '../../constants/network-safety';
import type {
  NetworkAddress,
  NetworkInterface,
} from '../../types/network.types';

const execFileAsync = promisify(execFile);

type IpAddrJson = {
  ifindex?: number;
  ifname?: string;
  mtu?: number;
  operstate?: string;
  address?: string;
  flags?: string[];
  addr_info?: Array<{
    family?: string;
    local?: string;
    prefixlen?: number;
    scope?: string;
  }>;
};

@Injectable()
export class InterfacesInventoryService {
  private readonly logger = new Logger(InterfacesInventoryService.name);

  constructor(private readonly prisma: PrismaNetworkService) {}

  async list(): Promise<{
    checkedAt: string;
    interfaces: NetworkInterface[];
  }> {
    const [raw, notes] = await Promise.all([
      this.readIpAddr(),
      this.prisma.interfaceNote.findMany(),
    ]);
    const notesByName = new Map(
      notes.map((n) => [n.ifName, { label: n.label, notes: n.notes }]),
    );

    const interfaces = raw.map((item) => {
      const ifName = item.ifname ?? '';
      const note = notesByName.get(ifName);
      const addresses: NetworkAddress[] = (item.addr_info ?? [])
        .filter((a) => a.local)
        .map((a) => {
          const family = a.family ?? 'inet';
          const local = a.local ?? '';
          const prefixlen = a.prefixlen ?? 0;
          return {
            family,
            local,
            prefixlen,
            scope: a.scope ?? '',
            cidr: `${local}/${prefixlen}`,
          };
        });

      return {
        ifName,
        ifIndex: item.ifindex ?? 0,
        mtu: item.mtu ?? 0,
        operState: item.operstate ?? 'UNKNOWN',
        mac: item.address ?? null,
        flags: item.flags ?? [],
        addresses,
        noteLabel: note?.label ?? '',
        noteText: note?.notes ?? '',
        canControl: !PROTECTED_IFACES.has(ifName),
      } satisfies NetworkInterface;
    });

    interfaces.sort((a, b) => a.ifIndex - b.ifIndex);

    return {
      checkedAt: new Date().toISOString(),
      interfaces,
    };
  }

  private async readIpAddr(): Promise<IpAddrJson[]> {
    try {
      const { stdout } = await execFileAsync('ip', ['-j', 'addr'], {
        timeout: 10000,
        maxBuffer: 4 * 1024 * 1024,
      });
      return JSON.parse(stdout) as IpAddrJson[];
    } catch (err) {
      this.logger.warn(
        `ip addr failed: ${err instanceof Error ? err.message : err}`,
      );
      return [];
    }
  }
}
