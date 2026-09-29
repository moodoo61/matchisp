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
  IPV4_CIDR_RE,
  PROTECTED_IFACES,
} from '../../constants/network-safety';

const execFileAsync = promisify(execFile);

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(private readonly audit: AuditService) {}

  async add(ifName: string, cidr: string, actorId: string) {
    this.assertIface(ifName);
    this.assertCidr(cidr);
    try {
      await execFileAsync(
        'ip',
        ['addr', 'add', cidr, 'dev', ifName],
        { timeout: 15000, maxBuffer: 1024 * 1024 },
      );
    } catch (err) {
      this.logger.warn(`ip addr add ${cidr} ${ifName}: ${this.msg(err)}`);
      throw new BadRequestException(`فشل إضافة العنوان: ${this.msg(err)}`);
    }

    await this.audit.log({
      actorId,
      action: 'addr_add',
      resource: 'network.address',
      resourceId: ifName,
      metadata: { cidr },
    });

    return { success: true, ifName, cidr };
  }

  async remove(ifName: string, cidr: string, actorId: string) {
    this.assertIface(ifName);
    this.assertCidr(cidr);
    try {
      await execFileAsync(
        'ip',
        ['addr', 'del', cidr, 'dev', ifName],
        { timeout: 15000, maxBuffer: 1024 * 1024 },
      );
    } catch (err) {
      this.logger.warn(`ip addr del ${cidr} ${ifName}: ${this.msg(err)}`);
      throw new BadRequestException(`فشل حذف العنوان: ${this.msg(err)}`);
    }

    await this.audit.log({
      actorId,
      action: 'addr_del',
      resource: 'network.address',
      resourceId: ifName,
      metadata: { cidr },
    });

    return { success: true, ifName, cidr };
  }

  private assertIface(ifName: string) {
    if (!IFACE_NAME_RE.test(ifName)) {
      throw new BadRequestException('اسم المنفذ غير صالح');
    }
    if (PROTECTED_IFACES.has(ifName)) {
      throw new BadRequestException(`المنفذ المحمي لا يمكن تعديله: ${ifName}`);
    }
  }

  private assertCidr(cidr: string) {
    if (!IPV4_CIDR_RE.test(cidr.trim())) {
      throw new BadRequestException(
        'صيغة العنوان غير صالحة — استخدم مثل 192.168.1.10/24',
      );
    }
    const [ip] = cidr.split('/');
    const parts = ip.split('.').map(Number);
    if (parts.some((n) => n < 0 || n > 255)) {
      throw new BadRequestException('عنوان IP غير صالح');
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
