import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaNetworkPagesService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import {
  CONTACT_METHOD_TYPE_LABELS,
  isContactMethodType,
} from '../constants/contact-method-types';
import { CreateContactMethodDto } from '../dto/create-contact-method.dto';
import { UpdateContactMethodDto } from '../dto/update-contact-method.dto';
import { PageCardFlagsService } from './page_card_flags.service';

@Injectable()
export class LoginContactsService {
  constructor(
    private readonly prisma: PrismaNetworkPagesService,
    private readonly audit: AuditService,
    private readonly flags: PageCardFlagsService,
  ) {}

  listAdmin() {
    return this.prisma.contactMethod.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * شكل متوافق مع سكربت العميل:
   * [{ contact_type, contact_type_display, value, notes, order }]
   */
  async listPublic() {
    if (!(await this.flags.isEnabled('login_contacts'))) return [];
    const items = await this.prisma.contactMethod.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return items
      .filter((item) => item.value.trim() !== '')
      .map((item) => ({
        contact_type: item.contactType,
        contact_type_display:
          item.displayName.trim() ||
          (isContactMethodType(item.contactType)
            ? CONTACT_METHOD_TYPE_LABELS[item.contactType]
            : item.contactType),
        value: item.value.trim(),
        notes: item.notes?.trim() ?? '',
        order: item.sortOrder,
      }));
  }

  async get(id: string) {
    const item = await this.prisma.contactMethod.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('طريقة التواصل غير موجودة');
    return item;
  }

  async create(dto: CreateContactMethodDto, actorId: string) {
    const item = await this.prisma.contactMethod.create({
      data: {
        contactType: dto.contactType,
        displayName: dto.displayName.trim(),
        value: dto.value.trim(),
        notes: dto.notes?.trim() ?? '',
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'page_management.login.contact_method',
      resourceId: item.id,
      metadata: { contactType: item.contactType },
    });
    return item;
  }

  async update(id: string, dto: UpdateContactMethodDto, actorId: string) {
    await this.get(id);
    const item = await this.prisma.contactMethod.update({
      where: { id },
      data: {
        contactType: dto.contactType,
        displayName: dto.displayName?.trim(),
        value: dto.value?.trim(),
        notes: dto.notes === undefined ? undefined : dto.notes.trim(),
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'page_management.login.contact_method',
      resourceId: item.id,
      metadata: { fields: Object.keys(dto) },
    });
    return item;
  }

  async remove(id: string, actorId: string) {
    await this.get(id);
    await this.prisma.contactMethod.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'page_management.login.contact_method',
      resourceId: id,
    });
    return { success: true };
  }
}
