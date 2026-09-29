import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaNetworkPagesService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import {
  PAGE_CARD_FLAG_KEYS,
  type PageCardFlagKey,
} from '../constants/page_card_flags';
import { UpdatePageCardFlagDto } from '../dto/update-page-card-flag.dto';

@Injectable()
export class PageCardFlagsService {
  constructor(
    private readonly prisma: PrismaNetworkPagesService,
    private readonly audit: AuditService,
  ) {}

  async ensureDefaults() {
    await Promise.all(
      PAGE_CARD_FLAG_KEYS.map((key) =>
        this.prisma.pageCardFlag.upsert({
          where: { key },
          update: {},
          create: { key, isEnabled: true },
        }),
      ),
    );
  }

  async list() {
    await this.ensureDefaults();
    return this.prisma.pageCardFlag.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async isEnabled(key: PageCardFlagKey): Promise<boolean> {
    const row = await this.prisma.pageCardFlag.findUnique({ where: { key } });
    if (!row) {
      await this.prisma.pageCardFlag.create({
        data: { key, isEnabled: true },
      });
      return true;
    }
    return row.isEnabled;
  }

  async get(key: string) {
    await this.ensureDefaults();
    const row = await this.prisma.pageCardFlag.findUnique({ where: { key } });
    if (!row) throw new NotFoundException('مفتاح البطاقة غير موجود');
    return row;
  }

  async update(key: string, dto: UpdatePageCardFlagDto, actorId: string) {
    if (!(PAGE_CARD_FLAG_KEYS as readonly string[]).includes(key)) {
      throw new NotFoundException('مفتاح البطاقة غير موجود');
    }
    const item = await this.prisma.pageCardFlag.upsert({
      where: { key },
      update: { isEnabled: dto.isEnabled },
      create: { key, isEnabled: dto.isEnabled },
    });
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'page_management.card_flag',
      resourceId: key,
      metadata: { isEnabled: item.isEnabled },
    });
    return item;
  }
}
