import { Injectable } from '@nestjs/common';
import { PrismaSettingsService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';
import { UpsertDiskNoteDto } from '../dto/upsert-disk-note.dto';

@Injectable()
export class DisksNotesService {
  constructor(
    private readonly prisma: PrismaSettingsService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.diskNote.findMany({
      orderBy: { devicePath: 'asc' },
    });
  }

  async upsert(dto: UpsertDiskNoteDto, actorId: string) {
    const devicePath = dto.devicePath.trim();
    const row = await this.prisma.diskNote.upsert({
      where: { devicePath },
      create: {
        devicePath,
        label: (dto.label ?? '').trim(),
        notes: (dto.notes ?? '').trim(),
      },
      update: {
        ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes.trim() } : {}),
      },
    });

    await this.audit.log({
      actorId,
      action: 'upsert',
      resource: 'settings.disk_note',
      resourceId: row.id,
      metadata: { devicePath: row.devicePath, label: row.label },
    });

    return row;
  }
}
