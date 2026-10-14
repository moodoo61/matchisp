import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaInventoryService } from '../../../database/database.module';
import { AuditService } from '../../audit/audit.service';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { InventoryUsersService } from './inventory-users.service';
import { WarehouseService } from './warehouse.service';

const DOC_INCLUDE = {
  lines: {
    include: {
      item: true,
      deviceUnit: true,
    },
  },
} as const;

type Tx = {
  deviceUnit: PrismaInventoryService['deviceUnit'];
  stockBalance: PrismaInventoryService['stockBalance'];
  stockMovement: PrismaInventoryService['stockMovement'];
  stockDocument: PrismaInventoryService['stockDocument'];
};

@Injectable()
export class StockDocumentsService {
  constructor(
    private readonly prisma: PrismaInventoryService,
    private readonly audit: AuditService,
    private readonly warehouse: WarehouseService,
    private readonly users: InventoryUsersService,
  ) {}

  async list(type?: string) {
    const rows = await this.prisma.stockDocument.findMany({
      where: type ? { type } : undefined,
      include: DOC_INCLUDE,
      orderBy: [{ number: 'desc' }],
      take: 200,
    });
    return this.enrichMany(rows);
  }

  async get(id: string) {
    const row = await this.prisma.stockDocument.findUnique({
      where: { id },
      include: DOC_INCLUDE,
    });
    if (!row) throw new NotFoundException('المستند غير موجود');
    const [enriched] = await this.enrichMany([row]);
    return enriched;
  }

  async create(dto: CreateDocumentDto, actorId: string) {
    const wh = await this.warehouse.getOrCreateMain();
    await this.validateLines(dto);

    if (dto.type === 'issue' && !dto.issuedToUserId && !dto.workOrderId) {
      throw new BadRequestException(
        'أمر الصرف يتطلب تحديد المستلم أو أمر العمل',
      );
    }
    if (dto.type === 'adjustment' && !(dto.note ?? '').trim()) {
      throw new BadRequestException('التعديل يتطلب سبب/ملاحظة');
    }

    const doc = await this.prisma.stockDocument.create({
      data: {
        warehouseId: wh.id,
        type: dto.type,
        note: (dto.note ?? '').trim(),
        issuedToUserId: dto.issuedToUserId ?? null,
        workOrderId: dto.workOrderId ?? null,
        partsRequestId: dto.partsRequestId ?? null,
        createdByUserId: actorId,
        lines: {
          create: dto.lines.map((l) => {
            const quantity =
              dto.type === 'adjustment'
                ? (l.adjustDelta ?? l.quantity ?? 0)
                : (l.quantity ?? 1);
            return {
              itemId: l.itemId,
              quantity,
              deviceUnitId: l.deviceUnitId ?? null,
              serial: l.serial?.trim() || null,
              note: (l.note ?? '').trim(),
            };
          }),
        },
      },
      include: DOC_INCLUDE,
    });

    await this.audit.log({
      actorId,
      action: 'create',
      resource: 'inventory.document',
      resourceId: doc.id,
      metadata: { number: doc.number, type: doc.type },
    });

    const [enriched] = await this.enrichMany([doc]);
    return enriched;
  }

  async post(id: string, actorId: string) {
    const doc = await this.prisma.stockDocument.findUnique({
      where: { id },
      include: DOC_INCLUDE,
    });
    if (!doc) throw new NotFoundException('المستند غير موجود');
    if (doc.status !== 'draft') {
      throw new BadRequestException('يمكن اعتماد المسودات فقط');
    }
    if (!doc.lines.length) {
      throw new BadRequestException('المستند بلا بنود');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const line of doc.lines) {
        if (!line.item.active) {
          throw new BadRequestException(`الصنف ${line.item.code} غير نشط`);
        }
        if (doc.type === 'receipt') {
          await this.applyReceipt(tx, doc, line, actorId);
        } else if (doc.type === 'issue') {
          await this.applyIssue(tx, doc, line, actorId);
        } else if (doc.type === 'return') {
          await this.applyReturn(tx, doc, line, actorId);
        } else if (doc.type === 'adjustment') {
          await this.applyAdjustment(tx, doc, line, actorId);
        }
      }

      await tx.stockDocument.update({
        where: { id },
        data: {
          status: 'posted',
          postedAt: new Date(),
          postedByUserId: actorId,
        },
      });
    });

    await this.audit.log({
      actorId,
      action: 'post',
      resource: 'inventory.document',
      resourceId: id,
      metadata: { number: doc.number, type: doc.type },
    });

    return this.get(id);
  }

  async cancel(id: string, actorId: string) {
    const doc = await this.prisma.stockDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('المستند غير موجود');
    if (doc.status !== 'draft') {
      throw new BadRequestException('يمكن إلغاء المسودات فقط');
    }
    await this.prisma.stockDocument.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    await this.audit.log({
      actorId,
      action: 'cancel',
      resource: 'inventory.document',
      resourceId: id,
      metadata: { number: doc.number },
    });
    return this.get(id);
  }

  private async validateLines(dto: CreateDocumentDto) {
    for (const line of dto.lines) {
      const item = await this.prisma.item.findUnique({
        where: { id: line.itemId },
      });
      if (!item) throw new BadRequestException('صنف غير موجود في البنود');

      if (dto.type === 'adjustment') {
        const delta = line.adjustDelta ?? line.quantity;
        if (!delta || delta === 0) {
          throw new BadRequestException('تعديل الكمية يجب ألا يكون صفراً');
        }
        if (item.kind === 'serialized') {
          throw new BadRequestException(
            'تعديل الكمية غير متاح للأصناف المتسلسلة',
          );
        }
        continue;
      }

      const qty = line.quantity ?? 1;
      if (item.kind === 'serialized') {
        if (dto.type === 'receipt') {
          if (!line.serial?.trim()) {
            throw new BadRequestException(
              `التوريد المتسلسل يتطلب رقم تسلسلي للصنف ${item.code}`,
            );
          }
          if (qty !== 1) {
            throw new BadRequestException(
              'كل بند توريد متسلسل يكون بكمية 1 ورقم تسلسلي واحد',
            );
          }
        }
        if (dto.type === 'issue' || dto.type === 'return') {
          if (!line.deviceUnitId) {
            throw new BadRequestException(
              `حدد الجهاز المتسلسل للصنف ${item.code}`,
            );
          }
        }
      } else if (line.serial || line.deviceUnitId) {
        throw new BadRequestException(
          `الصنف الاستهلاكي ${item.code} لا يستخدم أرقاماً تسلسلية`,
        );
      }
    }
  }

  private async applyReceipt(
    tx: Tx,
    doc: { id: string; warehouseId: string },
    line: {
      itemId: string;
      quantity: number;
      serial: string | null;
      item: { kind: string; code: string };
    },
    actorId: string,
  ) {
    let deviceUnitId: string | null = null;
    const qty = line.quantity;

    if (line.item.kind === 'serialized') {
      const serial = line.serial!.trim();
      const exists = await tx.deviceUnit.findUnique({ where: { serial } });
      if (exists) {
        throw new BadRequestException(`الرقم التسلسلي ${serial} موجود مسبقاً`);
      }
      const device = await tx.deviceUnit.create({
        data: {
          itemId: line.itemId,
          serial,
          status: 'in_stock',
        },
      });
      deviceUnitId = device.id;
    }

    const balanceAfter = await this.bumpBalance(
      tx,
      doc.warehouseId,
      line.itemId,
      qty,
    );
    await tx.stockMovement.create({
      data: {
        itemId: line.itemId,
        deviceUnitId,
        documentId: doc.id,
        type: 'receipt',
        delta: qty,
        balanceAfter,
        actorId,
        note: `توريد ${line.item.code}`,
      },
    });
  }

  private async applyIssue(
    tx: Tx,
    doc: {
      id: string;
      warehouseId: string;
      issuedToUserId: string | null;
      workOrderId: string | null;
    },
    line: {
      itemId: string;
      quantity: number;
      deviceUnitId: string | null;
      item: { kind: string; code: string };
    },
    actorId: string,
  ) {
    let deviceUnitId = line.deviceUnitId;
    const qty = line.item.kind === 'serialized' ? 1 : line.quantity;

    if (line.item.kind === 'serialized') {
      const device = await tx.deviceUnit.findUnique({
        where: { id: line.deviceUnitId! },
      });
      if (!device || device.itemId !== line.itemId) {
        throw new BadRequestException('الجهاز غير مطابق للصنف');
      }
      if (device.status !== 'in_stock') {
        throw new BadRequestException(
          `الجهاز ${device.serial} ليس في المخزن`,
        );
      }
      await tx.deviceUnit.update({
        where: { id: device.id },
        data: {
          status: 'issued',
          holderUserId: doc.issuedToUserId,
          workOrderId: doc.workOrderId,
        },
      });
      deviceUnitId = device.id;
    }

    const balanceAfter = await this.bumpBalance(
      tx,
      doc.warehouseId,
      line.itemId,
      -qty,
    );
    await tx.stockMovement.create({
      data: {
        itemId: line.itemId,
        deviceUnitId,
        documentId: doc.id,
        type: 'issue',
        delta: -qty,
        balanceAfter,
        actorId,
        note: `صرف ${line.item.code}`,
      },
    });
  }

  private async applyReturn(
    tx: Tx,
    doc: { id: string; warehouseId: string },
    line: {
      itemId: string;
      quantity: number;
      deviceUnitId: string | null;
      item: { kind: string; code: string };
    },
    actorId: string,
  ) {
    let deviceUnitId = line.deviceUnitId;
    const qty = line.item.kind === 'serialized' ? 1 : line.quantity;

    if (line.item.kind === 'serialized') {
      const device = await tx.deviceUnit.findUnique({
        where: { id: line.deviceUnitId! },
      });
      if (!device || device.itemId !== line.itemId) {
        throw new BadRequestException('الجهاز غير مطابق للصنف');
      }
      if (device.status !== 'issued' && device.status !== 'faulty') {
        throw new BadRequestException(
          `لا يمكن إرجاع الجهاز ${device.serial} بحالته الحالية`,
        );
      }
      await tx.deviceUnit.update({
        where: { id: device.id },
        data: {
          status: 'in_stock',
          holderUserId: null,
          workOrderId: null,
          installedAssetId: null,
        },
      });
      deviceUnitId = device.id;
    }

    const balanceAfter = await this.bumpBalance(
      tx,
      doc.warehouseId,
      line.itemId,
      qty,
    );
    await tx.stockMovement.create({
      data: {
        itemId: line.itemId,
        deviceUnitId,
        documentId: doc.id,
        type: 'return',
        delta: qty,
        balanceAfter,
        actorId,
        note: `إرجاع ${line.item.code}`,
      },
    });
  }

  private async applyAdjustment(
    tx: Tx,
    doc: { id: string; warehouseId: string; note: string },
    line: {
      itemId: string;
      quantity: number;
      item: { kind: string; code: string };
    },
    actorId: string,
  ) {
    if (line.item.kind === 'serialized') {
      throw new BadRequestException(
        'تعديل الكمية غير متاح للأصناف المتسلسلة — استخدم توريد/صرف/إرجاع',
      );
    }
    const delta = line.quantity;
    if (!delta) throw new BadRequestException('كمية التعديل صفر');

    const balanceAfter = await this.bumpBalance(
      tx,
      doc.warehouseId,
      line.itemId,
      delta,
    );
    await tx.stockMovement.create({
      data: {
        itemId: line.itemId,
        documentId: doc.id,
        type: 'adjustment',
        delta,
        balanceAfter,
        actorId,
        note: doc.note || `تعديل ${line.item.code}`,
      },
    });
  }

  private async bumpBalance(
    tx: Tx,
    warehouseId: string,
    itemId: string,
    delta: number,
  ) {
    let bal = await tx.stockBalance.findUnique({
      where: { warehouseId_itemId: { warehouseId, itemId } },
    });
    if (!bal) {
      bal = await tx.stockBalance.create({
        data: { warehouseId, itemId, quantity: 0 },
      });
    }
    const next = bal.quantity + delta;
    if (next < 0) {
      throw new BadRequestException('الرصيد غير كافٍ');
    }
    await tx.stockBalance.update({
      where: { id: bal.id },
      data: { quantity: next },
    });
    return next;
  }

  private async enrichMany(
    rows: Array<{
      id: string;
      number: number;
      warehouseId: string;
      type: string;
      status: string;
      note: string;
      issuedToUserId: string | null;
      workOrderId: string | null;
      partsRequestId: string | null;
      createdByUserId: string;
      postedByUserId: string | null;
      postedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      lines: unknown[];
    }>,
  ) {
    const userIds = rows.flatMap((r) =>
      [r.createdByUserId, r.postedByUserId, r.issuedToUserId].filter(
        Boolean,
      ) as string[],
    );
    const users = await this.users.loadMap(userIds);
    return rows.map((r) => ({
      ...r,
      createdBy: this.users.brief(users, r.createdByUserId),
      postedBy: this.users.brief(users, r.postedByUserId),
      issuedTo: this.users.brief(users, r.issuedToUserId),
    }));
  }
}
