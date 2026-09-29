import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaLiveService } from '../../../../database/database.module';

@Injectable()
export class ChannelSectionUniquenessService {
  constructor(private readonly prisma: PrismaLiveService) {}

  async assertUnique(opts: {
    name?: string;
    label?: string;
    excludeId?: string;
  }) {
    if (opts.name) {
      const clash = await this.prisma.channelSection.findFirst({
        where: {
          name: opts.name,
          ...(opts.excludeId ? { NOT: { id: opts.excludeId } } : {}),
        },
      });
      if (clash) {
        throw new ConflictException('معرّف name مستخدم مسبقاً لقسم آخر');
      }
    }
    if (opts.label) {
      const clash = await this.prisma.channelSection.findFirst({
        where: {
          label: opts.label,
          ...(opts.excludeId ? { NOT: { id: opts.excludeId } } : {}),
        },
      });
      if (clash) {
        throw new ConflictException('اسم العرض مستخدم مسبقاً لقسم آخر');
      }
    }
  }
}
