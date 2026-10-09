import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuditService } from '../../../audit/audit.service';
import { NmProfilesService } from '../../nm/service/nm-profiles.service';
import { NmcliService } from '../../nm/service/nmcli.service';

@Injectable()
export class InterfacesControlService {
  private readonly logger = new Logger(InterfacesControlService.name);

  constructor(
    private readonly audit: AuditService,
    private readonly profiles: NmProfilesService,
    private readonly nmcli: NmcliService,
  ) {}

  async setState(
    ifName: string,
    state: 'up' | 'down',
    actorId: string,
  ) {
    this.profiles.assertControllable(ifName);
    try {
      await this.profiles.setState(ifName, state);
    } catch (err) {
      this.logger.warn(
        `nm setState ${ifName} ${state}: ${this.nmcli.errMsg(err)}`,
      );
      if (
        err instanceof BadRequestException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      throw new BadRequestException(
        `فشل تغيير حالة المنفذ عبر NetworkManager: ${this.nmcli.errMsg(err)}`,
      );
    }

    await this.audit.log({
      actorId,
      action: state,
      resource: 'network.interface',
      resourceId: ifName,
      metadata: { state, backend: 'network-manager' },
    });

    return { success: true, ifName, state };
  }
}
