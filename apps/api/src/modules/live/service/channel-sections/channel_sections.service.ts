import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaLiveService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';
import { CreateChannelSectionDto } from '../../dto/channel-sections/create-channel-section.dto';
import { UpdateChannelSectionDto } from '../../dto/channel-sections/update-channel-section.dto';
import { normalizeLabel, normalizeName } from './section-paths';
import { ChannelSectionUniquenessService } from './section-uniqueness';

@Injectable()
export class ChannelSectionsService {
  constructor(
    private readonly prisma: PrismaLiveService,
    private readonly audit: AuditService,
    private readonly uniqueness: ChannelSectionUniquenessService,
  ) {}

  list() {
    return this.prisma.channelSection.findMany({
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
      include: { _count: { select: { channels: true } } },
    });
  }

  async get(id: string) {
    const item = await this.prisma.channelSection.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('القسم غير موجود');
    return item;
  }

  async create(dto: CreateChannelSectionDto, actorId: string) {
    const name = normalizeName(dto.name);
    const label = normalizeLabel(dto.label);
    await this.uniqueness.assertUnique({ name, label });
    const item = await this.prisma.channelSection.create({
      data: { name, label },
    });
    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'live.channel_section',
      resourceId: item.id,
    });
    return item;
  }

  async update(id: string, dto: UpdateChannelSectionDto, actorId: string) {
    await this.get(id);
    const name = dto.name !== undefined ? normalizeName(dto.name) : undefined;
    const label =
      dto.label !== undefined ? normalizeLabel(dto.label) : undefined;
    await this.uniqueness.assertUnique({ name, label, excludeId: id });
    const item = await this.prisma.channelSection.update({
      where: { id },
      data: {
        name,
        label,
        sortOrder: dto.sortOrder,
      },
    });
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'live.channel_section',
      resourceId: item.id,
    });
    return item;
  }

  async remove(id: string, actorId: string) {
    await this.get(id);
    const count = await this.prisma.channel.count({ where: { sectionId: id } });
    if (count > 0) {
      throw new ConflictException('لا يمكن حذف قسم يحتوي على قنوات');
    }
    await this.prisma.channelSection.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'live.channel_section',
      resourceId: id,
    });
    return { success: true };
  }
}
