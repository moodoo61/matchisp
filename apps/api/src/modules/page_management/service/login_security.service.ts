import { Injectable } from '@nestjs/common';
import { PrismaNetworkPagesService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { UpdateLoginSecurityDto } from '../dto/update-login-security.dto';

const DEFAULT_ID = 'default';

@Injectable()
export class LoginSecurityService {
  constructor(
    private readonly prisma: PrismaNetworkPagesService,
    private readonly audit: AuditService,
  ) {}

  async get() {
    const existing = await this.prisma.loginSecuritySettings.findUnique({
      where: { id: DEFAULT_ID },
    });
    if (existing) return existing;
    return this.prisma.loginSecuritySettings.create({
      data: { id: DEFAULT_ID },
    });
  }

  /** للاستجابة العامة — بدون حقول إدارية زائدة */
  async getPublic() {
    const s = await this.get();
    return {
      enabled: s.enabled,
      tryCount: s.tryCount,
      blockMinutes: s.blockMinutes,
    };
  }

  async update(dto: UpdateLoginSecurityDto, actorId: string) {
    await this.get();
    const item = await this.prisma.loginSecuritySettings.update({
      where: { id: DEFAULT_ID },
      data: {
        ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
        ...(dto.tryCount !== undefined ? { tryCount: dto.tryCount } : {}),
        ...(dto.blockMinutes !== undefined
          ? { blockMinutes: dto.blockMinutes }
          : {}),
      },
    });
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'page_management.login.security',
      resourceId: item.id,
    });
    return item;
  }
}
