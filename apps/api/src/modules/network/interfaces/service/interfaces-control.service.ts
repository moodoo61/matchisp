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
  PROTECTED_IFACES,
} from '../../constants/network-safety';

const execFileAsync = promisify(execFile);

@Injectable()
export class InterfacesControlService {
  private readonly logger = new Logger(InterfacesControlService.name);

  constructor(private readonly audit: AuditService) {}

  async setState(
    ifName: string,
    state: 'up' | 'down',
    actorId: string,
  ) {
    this.assertIface(ifName);
    try {
      await execFileAsync('ip', ['link', 'set', 'dev', ifName, state], {
        timeout: 15000,
        maxBuffer: 1024 * 1024,
      });
    } catch (err) {
      this.logger.warn(`ip link set ${ifName} ${state}: ${this.msg(err)}`);
      throw new BadRequestException(`فشل تغيير حالة المنفذ: ${this.msg(err)}`);
    }

    await this.audit.log({
      actorId,
      action: state,
      resource: 'network.interface',
      resourceId: ifName,
      metadata: { state },
    });

    return { success: true, ifName, state };
  }

  private assertIface(ifName: string) {
    if (!IFACE_NAME_RE.test(ifName)) {
      throw new BadRequestException('اسم المنفذ غير صالح');
    }
    if (PROTECTED_IFACES.has(ifName)) {
      throw new BadRequestException(`المنفذ المحمي لا يمكن تعديله: ${ifName}`);
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
