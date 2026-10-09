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
export class InterfacesAdoptService {
  private readonly logger = new Logger(InterfacesAdoptService.name);

  constructor(
    private readonly audit: AuditService,
    private readonly profiles: NmProfilesService,
    private readonly nmcli: NmcliService,
  ) {}

  async adopt(ifName: string, actorId: string) {
    this.profiles.assertControllable(ifName);
    let result: {
      connection: string;
      addresses: string[];
      persistent: boolean;
    };
    try {
      result = await this.profiles.adoptMatchProfile(ifName);
    } catch (err) {
      this.logger.warn(`nm adopt ${ifName}: ${this.nmcli.errMsg(err)}`);
      if (
        err instanceof BadRequestException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      throw new BadRequestException(
        `فشل تحويل المنفذ للطريقة الدائمة: ${this.nmcli.errMsg(err)}`,
      );
    }

    await this.audit.log({
      actorId,
      action: 'nm_adopt',
      resource: 'network.interface',
      resourceId: ifName,
      metadata: {
        connection: result.connection,
        addresses: result.addresses,
        persistent: result.persistent,
        backend: 'network-manager-match',
      },
    });

    return {
      success: true,
      ifName,
      connection: result.connection,
      addresses: result.addresses,
      persistent: result.persistent,
    };
  }
}
