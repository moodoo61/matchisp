import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuditService } from '../../../audit/audit.service';
import { IPV4_CIDR_RE } from '../../constants/network-safety';
import { NmProfilesService } from '../../nm/service/nm-profiles.service';
import { NmcliService } from '../../nm/service/nmcli.service';

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(
    private readonly audit: AuditService,
    private readonly profiles: NmProfilesService,
    private readonly nmcli: NmcliService,
  ) {}

  async add(ifName: string, cidr: string, actorId: string) {
    this.profiles.assertControllable(ifName);
    this.assertCidr(cidr);
    try {
      await this.profiles.addAddress(ifName, cidr.trim());
    } catch (err) {
      this.logger.warn(
        `nm addr add ${cidr} ${ifName}: ${this.nmcli.errMsg(err)}`,
      );
      if (
        err instanceof BadRequestException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      throw new BadRequestException(
        `فشل إضافة العنوان عبر NetworkManager: ${this.nmcli.errMsg(err)}`,
      );
    }

    await this.audit.log({
      actorId,
      action: 'addr_add',
      resource: 'network.address',
      resourceId: ifName,
      metadata: { cidr, backend: 'network-manager' },
    });

    return { success: true, ifName, cidr };
  }

  async remove(ifName: string, cidr: string, actorId: string) {
    this.profiles.assertControllable(ifName);
    this.assertCidr(cidr);
    try {
      await this.profiles.removeAddress(ifName, cidr.trim());
    } catch (err) {
      this.logger.warn(
        `nm addr del ${cidr} ${ifName}: ${this.nmcli.errMsg(err)}`,
      );
      if (
        err instanceof BadRequestException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      throw new BadRequestException(
        `فشل حذف العنوان عبر NetworkManager: ${this.nmcli.errMsg(err)}`,
      );
    }

    await this.audit.log({
      actorId,
      action: 'addr_del',
      resource: 'network.address',
      resourceId: ifName,
      metadata: { cidr, backend: 'network-manager' },
    });

    return { success: true, ifName, cidr };
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
}
